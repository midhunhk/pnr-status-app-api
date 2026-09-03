import { z } from 'zod';

export const ServiceConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  service: z.string(),
  enabled: z.boolean(),
  stub: z.boolean(),
  stub_file: z.string().default(''),
});

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

export const AppServicesConfigSchema = z.object({
  version: z.string(),
  name: z.string(),
  services: z.array(ServiceConfigSchema),
});

export type AppServicesConfig = z.infer<typeof AppServicesConfigSchema>;
