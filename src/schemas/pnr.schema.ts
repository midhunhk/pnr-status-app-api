import { z } from 'zod';

export const PnrRequestParamsSchema = z.object({
  serviceId: z.string().trim().min(1, "serviceId is required"),
  pnrNumber: z.string().trim().min(1, "pnrNumber is required"),
});

export type PnrRequestParams = z.infer<typeof PnrRequestParamsSchema>;

export const TrainDetailsSchema = z.object({
  trainNo: z.string().default(''),
  trainName: z.string().default(''),
  trainFrom: z.string().default(''),
  trainTo: z.string().default(''),
});

export type TrainDetails = z.infer<typeof TrainDetailsSchema>;

export const TravelDetailsSchema = z.object({
  boardingPoint: z.string().default(''),
  reservedUpto: z.string().default(''),
  travelDate: z.string().default(''),
  travelDateString: z.string().default(''),
  ticketClass: z.string().default(''),
  bookingStatus: z.string().default(''),
  currentStatus: z.string().default(''),
});

export type TravelDetails = z.infer<typeof TravelDetailsSchema>;

export const PassengerInfoSchema = z.object({
  name: z.string().default(''),
  seat: z.string().default(''),
  status: z.string().default(''),
  quota: z.string().optional(),
});

export type PassengerInfo = z.infer<typeof PassengerInfoSchema>;

export const PnrStatusResponseSchema = z.object({
  version: z.number().default(1),
  status: z.string(),
  service: z.string().optional(),
  message: z.string().optional(),
  pnrNo: z.string().optional(),
  passengersCount: z.union([z.string(), z.number()]).optional(),
  trainDetails: TrainDetailsSchema.optional(),
  travelDetails: TravelDetailsSchema.optional(),
  passengerDetails: z.array(PassengerInfoSchema).optional(),
  // Backward compatibility alias for legacy consumers expecting 'pasengerDetails'
  pasengerDetails: z.array(PassengerInfoSchema).optional(),
});

export type PnrStatusResponse = z.infer<typeof PnrStatusResponseSchema>;
