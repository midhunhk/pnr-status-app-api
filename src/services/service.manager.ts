import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { AppServicesConfig, AppServicesConfigSchema, ServiceConfig } from '../schemas/service.schema.js';
import { PnrStatusResponse } from '../schemas/pnr.schema.js';
import { ServiceProvider } from './base.service.js';

import erailsService from './erails.service.js';
import railyatriService from './railyatri.service.js';
import trainpnrstatusService from './trainpnrstatus.service.js';
import searchService from './search.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESPONSE_SCHEMA_VERSION = 1;

class ServiceManager {
  private configCache: AppServicesConfig | null = null;
  private providers: Record<string, ServiceProvider> = {
    'erails.service.ts': erailsService,
    'erails.js': erailsService,
    'railyatri.service.ts': railyatriService,
    'railyatri.js': railyatriService,
    'trainpnrstatus.service.ts': trainpnrstatusService,
    'trainpnrstatus.js': trainpnrstatusService,
    'search.service.ts': searchService,
    'search.js': searchService,
  };

  /**
   * Reads services.config.json asynchronously and caches it in memory.
   */
  async loadConfig(): Promise<AppServicesConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    const configPath = path.resolve(__dirname, '../config/services.config.json');
    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      const parsedJson = JSON.parse(fileContent);
      const validatedConfig = AppServicesConfigSchema.parse(parsedJson);
      this.configCache = validatedConfig;
      return validatedConfig;
    } catch (err) {
      throw new Error(`Failed to load service configuration: ${(err as Error).message}`);
    }
  }

  /**
   * Clears in-memory configuration cache (useful for testing).
   */
  clearCache(): void {
    this.configCache = null;
  }

  /**
   * Locates and returns the service configuration for a serviceId.
   */
  async findServiceConfig(serviceId: string): Promise<ServiceConfig> {
    const config = await this.loadConfig();
    const targetService = config.services.find((s) => s.id === serviceId);

    if (!targetService) {
      throw new Error(`Service id ${serviceId} is invalid.`);
    }

    if (!targetService.enabled) {
      throw new Error(`Service id ${serviceId} is disabled.`);
    }

    return targetService;
  }

  /**
   * Executes a requested service by ID for a given PNR / search string.
   */
  async execute(serviceId: string, pnrNumber: string): Promise<PnrStatusResponse> {
    const serviceConfig = await this.findServiceConfig(serviceId);
    const provider = this.providers[serviceConfig.service];

    if (!provider) {
      throw new Error(`Provider implementation for '${serviceConfig.service}' was not found.`);
    }

    let rawData: unknown;

    if (serviceConfig.stub) {
      const stubPath = path.resolve(__dirname, '../', serviceConfig.stub_file);
      rawData = await fs.readFile(stubPath, 'utf-8');
    } else {
      const requestConfig = provider.getConfig(pnrNumber);
      const response = await axios(requestConfig);
      rawData = response.data;
    }

    const parsedResult = provider.parseResponse(rawData);

    if (Array.isArray(parsedResult)) {
      return {
        version: RESPONSE_SCHEMA_VERSION,
        status: 'READY',
        service: provider.name,
        pnrNo: pnrNumber,
        passengerDetails: [],
        pasengerDetails: [],
        items: parsedResult,
      } as any;
    }

    return {
      version: RESPONSE_SCHEMA_VERSION,
      status: 'READY',
      service: provider.name,
      pnrNo: pnrNumber,
      ...parsedResult,
    } as PnrStatusResponse;
  }
}

export const serviceManager = new ServiceManager();
export default serviceManager;
