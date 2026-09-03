import { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { ServiceProvider } from './base.service.js';

export class SearchService implements ServiceProvider {
  name = 'search-service';

  getConfig(query: string): AxiosRequestConfig {
    const getUrl = `https://www.google.ca/search?source=hp&q=${encodeURIComponent(query)}`;
    return {
      method: 'get',
      url: getUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    };
  }

  parseResponse(response: unknown): Array<{ text: string }> {
    const htmlContent = typeof response === 'string' ? response : String(response);
    const $ = cheerio.load(htmlContent);
    const resultObj: Array<{ text: string }> = [];

    $('h3').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        resultObj.push({ text });
      }
    });

    return resultObj;
  }
}

export default new SearchService();
