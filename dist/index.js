import express, { Router } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ZodError, z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import * as cheerio from "cheerio";
//#region src/middleware/validate.middleware.ts
var validateParams = (schema) => {
	return async (req, res, next) => {
		try {
			req.params = await schema.parseAsync(req.params);
			next();
		} catch (err) {
			if (err instanceof ZodError) {
				res.status(400).json({
					version: 1,
					status: "ERROR",
					message: "Invalid request parameters",
					errors: err.issues.map((e) => ({
						field: e.path.join("."),
						message: e.message
					}))
				});
				return;
			}
			next(err);
		}
	};
};
//#endregion
//#region src/schemas/pnr.schema.ts
var PnrRequestParamsSchema = z.object({
	serviceId: z.string().trim().min(1, "serviceId is required"),
	pnrNumber: z.string().trim().min(1, "pnrNumber is required")
});
var TrainDetailsSchema = z.object({
	trainNo: z.string().default(""),
	trainName: z.string().default(""),
	trainFrom: z.string().default(""),
	trainTo: z.string().default("")
});
var TravelDetailsSchema = z.object({
	boardingPoint: z.string().default(""),
	reservedUpto: z.string().default(""),
	travelDate: z.string().default(""),
	travelDateString: z.string().default(""),
	ticketClass: z.string().default(""),
	bookingStatus: z.string().default(""),
	currentStatus: z.string().default("")
});
var PassengerInfoSchema = z.object({
	name: z.string().default(""),
	seat: z.string().default(""),
	status: z.string().default(""),
	quota: z.string().optional()
});
z.object({
	version: z.number().default(1),
	status: z.string(),
	service: z.string().optional(),
	message: z.string().optional(),
	pnrNo: z.string().optional(),
	passengersCount: z.union([z.string(), z.number()]).optional(),
	trainDetails: TrainDetailsSchema.optional(),
	travelDetails: TravelDetailsSchema.optional(),
	passengerDetails: z.array(PassengerInfoSchema).optional(),
	pasengerDetails: z.array(PassengerInfoSchema).optional()
});
//#endregion
//#region src/schemas/service.schema.ts
var ServiceConfigSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	service: z.string(),
	enabled: z.boolean(),
	stub: z.boolean(),
	stub_file: z.string().default("")
});
var AppServicesConfigSchema = z.object({
	version: z.string(),
	name: z.string(),
	services: z.array(ServiceConfigSchema)
});
//#endregion
//#region src/services/erails.service.ts
var ErailsService = class {
	name = "erails";
	getConfig(pnr) {
		return {
			method: "get",
			url: `https://data.tripmgt.com/Data.aspx?Action=PNR_STATUS_RR&Data1=${encodeURIComponent(pnr)}&t=${Date.now()}`,
			timeout: 1e4
		};
	}
	parseResponse(response) {
		let responseJSON;
		if (typeof response === "object" && response !== null) responseJSON = response;
		else if (typeof response === "string") responseJSON = JSON.parse(response);
		else throw new Error("Invalid response format from Erails service");
		let pnrDataObj;
		if (typeof responseJSON.PnrData === "string") pnrDataObj = JSON.parse(responseJSON.PnrData);
		else if (typeof responseJSON.PnrData === "object" && responseJSON.PnrData !== null) pnrDataObj = responseJSON.PnrData;
		else pnrDataObj = responseJSON;
		const travelData = pnrDataObj.data || pnrDataObj;
		const resultObj = {
			status: pnrDataObj.status || "READY",
			message: pnrDataObj.message || "",
			pnrNo: travelData.pnrNo || "",
			passengersCount: travelData.noOfPassenger || 0,
			trainDetails: this.getTrainDetails(travelData),
			travelDetails: this.getTravelDetails(travelData)
		};
		const passengerDetails = this.getPassengerDetails(travelData.passengerDetailsDTO || [], travelData.noOfPassenger || 0);
		resultObj.passengerDetails = passengerDetails;
		resultObj.pasengerDetails = passengerDetails;
		return resultObj;
	}
	getPassengerDetails(passengerData, passengersCount) {
		const passengerDetails = [];
		const count = Array.isArray(passengerData) ? passengerData.length : passengersCount;
		for (let i = 0; i < count; i++) {
			const responseData = passengerData[i] || {};
			passengerDetails.push({
				name: `Passenger ${i + 1}`,
				seat: "seat",
				status: responseData.seatStts || "UNKNOWN",
				quota: responseData.quotaCode || ""
			});
		}
		return passengerDetails;
	}
	getTrainDetails(pnrData) {
		return {
			trainNo: pnrData.trainNum || "",
			trainName: pnrData.trainName || "",
			trainFrom: pnrData.stationFrom || "",
			trainTo: pnrData.stationTo || ""
		};
	}
	getTravelDetails(pnrData) {
		return {
			boardingPoint: pnrData.boardingPoint || "",
			reservedUpto: pnrData.reservationUpTo || "",
			travelDate: pnrData.departureDate || "",
			travelDateString: pnrData.departureDate || "",
			ticketClass: pnrData.journeyClass || "",
			bookingStatus: pnrData.chartStts || "",
			currentStatus: pnrData.chartStts || ""
		};
	}
};
var erails_service_default = new ErailsService();
//#endregion
//#region src/services/railyatri.service.ts
var RailYatriService = class {
	name = "rail-yatri";
	getConfig(pnr) {
		return {
			method: "get",
			url: `https://www.railyatri.in/pnr-status/${encodeURIComponent(pnr)}`,
			timeout: 1e4,
			headers: {
				Host: "www.railyatri.in",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
			}
		};
	}
	parseResponse(response) {
		const htmlContent = typeof response === "string" ? response : String(response);
		const $ = cheerio.load(htmlContent);
		const resultObj = {};
		const parts = $("#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.col-xs-12.train-info > a > p").text().trim().split("-");
		const trainNo = parts[0] ? parts[0].trim() : "";
		const trainName = parts.length > 1 ? parts.slice(1).join("-").trim() : "";
		const trainFrom = $("#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.train-route > div:nth-child(1) > p.pnr-bold-txt").text().trim();
		const trainTo = $("#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.train-route > div:nth-child(2) > p.pnr-bold-txt").text().trim();
		resultObj.trainDetails = {
			trainNo,
			trainName,
			trainFrom,
			trainTo
		};
		resultObj.passengersCount = "Unavailable";
		const travelDate = $("#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.boarding-detls > div:nth-child(1) > p.pnr-bold-txt").text().trim();
		const ticketClass = $("#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.boarding-detls > div:nth-child(2) > p.pnr-bold-txt").text().trim();
		const bookingStatus = $("#status > div:nth-child(2) > div:nth-child(1) > p").text().trim();
		const currentStatus = $("#status > div:nth-child(2) > div:nth-child(2) > p").text().trim();
		resultObj.travelDetails = {
			boardingPoint: trainFrom,
			reservedUpto: trainTo,
			travelDate,
			travelDateString: travelDate,
			ticketClass,
			bookingStatus,
			currentStatus
		};
		const passengerDetails = [{
			name: "Not available",
			seat: "Not Available",
			status: currentStatus || "UNKNOWN"
		}];
		resultObj.passengerDetails = passengerDetails;
		resultObj.pasengerDetails = passengerDetails;
		return resultObj;
	}
};
var railyatri_service_default = new RailYatriService();
//#endregion
//#region src/services/trainpnrstatus.service.ts
var TrainPnrStatusService = class {
	name = "trainpnrstatus";
	getConfig(pnr) {
		return {
			method: "post",
			url: "https://www.trainspnrstatus.com/pnrformcheck.php",
			timeout: 1e4,
			data: `lccp_pnrno1=${encodeURIComponent(pnr)}`,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Referer: "https://www.trainspnrstatus.com/",
				Origin: "https://www.trainspnrstatus.com",
				Host: "www.trainspnrstatus.com",
				DNT: "1"
			}
		};
	}
	parseResponse(response) {
		if (typeof response === "object" && response !== null) return response;
		return { rawResponse: String(response) };
	}
};
var trainpnrstatus_service_default = new TrainPnrStatusService();
//#endregion
//#region src/services/search.service.ts
var SearchService = class {
	name = "search-service";
	getConfig(query) {
		return {
			method: "get",
			url: `https://www.google.ca/search?source=hp&q=${encodeURIComponent(query)}`,
			timeout: 1e4,
			headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
		};
	}
	parseResponse(response) {
		const htmlContent = typeof response === "string" ? response : String(response);
		const $ = cheerio.load(htmlContent);
		const resultObj = [];
		$("h3").each((_, element) => {
			const text = $(element).text().trim();
			if (text) resultObj.push({ text });
		});
		return resultObj;
	}
};
var search_service_default = new SearchService();
//#endregion
//#region src/services/service.manager.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var RESPONSE_SCHEMA_VERSION = 1;
var ServiceManager = class {
	configCache = null;
	providers = {
		"erails.service.ts": erails_service_default,
		"erails.js": erails_service_default,
		"railyatri.service.ts": railyatri_service_default,
		"railyatri.js": railyatri_service_default,
		"trainpnrstatus.service.ts": trainpnrstatus_service_default,
		"trainpnrstatus.js": trainpnrstatus_service_default,
		"search.service.ts": search_service_default,
		"search.js": search_service_default
	};
	/**
	* Reads services.config.json asynchronously and caches it in memory.
	*/
	async loadConfig() {
		if (this.configCache) return this.configCache;
		const configPath = path.resolve(__dirname, "../config/services.config.json");
		try {
			const fileContent = await fs.readFile(configPath, "utf-8");
			const parsedJson = JSON.parse(fileContent);
			const validatedConfig = AppServicesConfigSchema.parse(parsedJson);
			this.configCache = validatedConfig;
			return validatedConfig;
		} catch (err) {
			throw new Error(`Failed to load service configuration: ${err.message}`);
		}
	}
	/**
	* Clears in-memory configuration cache (useful for testing).
	*/
	clearCache() {
		this.configCache = null;
	}
	/**
	* Locates and returns the service configuration for a serviceId.
	*/
	async findServiceConfig(serviceId) {
		const targetService = (await this.loadConfig()).services.find((s) => s.id === serviceId);
		if (!targetService) throw new Error(`Service id ${serviceId} is invalid.`);
		if (!targetService.enabled) throw new Error(`Service id ${serviceId} is disabled.`);
		return targetService;
	}
	/**
	* Executes a requested service by ID for a given PNR / search string.
	*/
	async execute(serviceId, pnrNumber) {
		const serviceConfig = await this.findServiceConfig(serviceId);
		const provider = this.providers[serviceConfig.service];
		if (!provider) throw new Error(`Provider implementation for '${serviceConfig.service}' was not found.`);
		let rawData;
		if (serviceConfig.stub) {
			const stubPath = path.resolve(__dirname, "../", serviceConfig.stub_file);
			rawData = await fs.readFile(stubPath, "utf-8");
		} else {
			const requestConfig = provider.getConfig(pnrNumber);
			rawData = (await axios(requestConfig)).data;
		}
		const parsedResult = provider.parseResponse(rawData);
		if (Array.isArray(parsedResult)) return {
			version: RESPONSE_SCHEMA_VERSION,
			status: "READY",
			service: provider.name,
			pnrNo: pnrNumber,
			passengerDetails: [],
			pasengerDetails: [],
			items: parsedResult
		};
		return {
			version: RESPONSE_SCHEMA_VERSION,
			status: "READY",
			service: provider.name,
			pnrNo: pnrNumber,
			...parsedResult
		};
	}
};
var serviceManager = new ServiceManager();
//#endregion
//#region src/routes/pnr.routes.ts
var router = Router();
router.get("/", (_req, res) => {
	res.status(200).send("Hello Universe!");
});
router.get("/pnrstatus/:serviceId/:pnrNumber", validateParams(PnrRequestParamsSchema), async (req, res, next) => {
	const serviceId = req.params.serviceId;
	const pnrNumber = req.params.pnrNumber;
	try {
		const result = await serviceManager.execute(serviceId, pnrNumber);
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
});
router.get("/usage", (_req, res) => {
	res.status(200).send("GET /pnrstatus/{serviceId}/{pnrNumber}");
});
router.get("/health", (_req, res) => {
	res.status(200).json({
		status: "UP",
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	});
});
//#endregion
//#region src/middleware/error.middleware.ts
var errorHandler = (err, _req, res, _next) => {
	const statusCode = err.statusCode || 400;
	const responseJSON = {
		version: 1,
		status: "ERROR",
		message: err.message || "An unexpected error occurred"
	};
	res.status(statusCode).json(responseJSON);
};
//#endregion
//#region src/app.ts
var app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
var limiter = rateLimit({
	windowMs: 9e5,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false
});
app.use(limiter);
app.use("/", router);
app.use(errorHandler);
//#endregion
//#region src/index.ts
var PORT = process.env.PORT || "3000";
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
//#endregion
export {};
