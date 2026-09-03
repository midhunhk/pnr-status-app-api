import { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { ServiceProvider } from './base.service.js';
import { PassengerInfo, TrainDetails, TravelDetails } from '../schemas/pnr.schema.js';

export class RailYatriService implements ServiceProvider {
  name = 'rail-yatri';

  getConfig(pnr: string): AxiosRequestConfig {
    const getUrl = `https://www.railyatri.in/pnr-status/${encodeURIComponent(pnr)}`;
    return {
      method: 'get',
      url: getUrl,
      timeout: 10000,
      headers: {
        Host: 'www.railyatri.in',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    };
  }

  parseResponse(response: unknown): Record<string, any> {
    const htmlContent = typeof response === 'string' ? response : String(response);
    const $ = cheerio.load(htmlContent);

    const resultObj: Record<string, any> = {};

    const trainNumberName = $('#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.col-xs-12.train-info > a > p').text().trim();
    
    const parts = trainNumberName.split('-');
    const trainNo = parts[0] ? parts[0].trim() : '';
    const trainName = parts.length > 1 ? parts.slice(1).join('-').trim() : '';

    const trainFrom = $('#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.train-route > div:nth-child(1) > p.pnr-bold-txt').text().trim();
    const trainTo = $('#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.train-route > div:nth-child(2) > p.pnr-bold-txt').text().trim();

    resultObj.trainDetails = {
      trainNo,
      trainName,
      trainFrom,
      trainTo,
    } as TrainDetails;

    resultObj.passengersCount = 'Unavailable';

    const travelDate = $('#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.boarding-detls > div:nth-child(1) > p.pnr-bold-txt').text().trim();
    const ticketClass = $('#homepage-main-container > div.row > div.pnr-search-result-blk > div.pnr-search-result-info > div > div.boarding-detls > div:nth-child(2) > p.pnr-bold-txt').text().trim();
    const bookingStatus = $('#status > div:nth-child(2) > div:nth-child(1) > p').text().trim();
    const currentStatus = $('#status > div:nth-child(2) > div:nth-child(2) > p').text().trim();

    resultObj.travelDetails = {
      boardingPoint: trainFrom,
      reservedUpto: trainTo,
      travelDate,
      travelDateString: travelDate,
      ticketClass,
      bookingStatus,
      currentStatus,
    } as TravelDetails;

    const passengerDetails: PassengerInfo[] = [
      {
        name: 'Not available',
        seat: 'Not Available',
        status: currentStatus || 'UNKNOWN',
      },
    ];

    resultObj.passengerDetails = passengerDetails;
    resultObj.pasengerDetails = passengerDetails;

    return resultObj;
  }
}

export default new RailYatriService();
