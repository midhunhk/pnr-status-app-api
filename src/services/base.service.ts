import { AxiosRequestConfig } from 'axios';

export interface ServiceProvider {
  name: string;
  getConfig(pnr: string): AxiosRequestConfig;
  parseResponse(response: unknown): Record<string, unknown> | unknown[];
}
