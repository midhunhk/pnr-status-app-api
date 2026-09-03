import { AxiosRequestConfig } from 'axios';
import { ServiceProvider } from './base.service.js';

export class TrainPnrStatusService implements ServiceProvider {
  name = 'trainpnrstatus';

  getConfig(pnr: string): AxiosRequestConfig {
    const postUrl = 'https://www.trainspnrstatus.com/pnrformcheck.php';
    return {
      method: 'post',
      url: postUrl,
      timeout: 10000,
      data: `lccp_pnrno1=${encodeURIComponent(pnr)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://www.trainspnrstatus.com/',
        Origin: 'https://www.trainspnrstatus.com',
        Host: 'www.trainspnrstatus.com',
        DNT: '1',
      },
    };
  }

  parseResponse(response: unknown): Record<string, any> {
    if (typeof response === 'object' && response !== null) {
      return response as Record<string, any>;
    }
    return { rawResponse: String(response) };
  }
}

export default new TrainPnrStatusService();
