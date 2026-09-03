import { AxiosRequestConfig } from 'axios';
import { ServiceProvider } from './base.service.js';
import { PassengerInfo, TrainDetails, TravelDetails } from '../schemas/pnr.schema.js';

export class ErailsService implements ServiceProvider {
  name = 'erails';

  getConfig(pnr: string): AxiosRequestConfig {
    const ts = Date.now();
    const getUrl = `https://data.tripmgt.com/Data.aspx?Action=PNR_STATUS_RR&Data1=${encodeURIComponent(pnr)}&t=${ts}`;
    return {
      method: 'get',
      url: getUrl,
      timeout: 10000,
    };
  }

  parseResponse(response: unknown): Record<string, unknown> {
    let responseJSON: any;
    if (typeof response === 'object' && response !== null) {
      responseJSON = response;
    } else if (typeof response === 'string') {
      responseJSON = JSON.parse(response);
    } else {
      throw new Error('Invalid response format from Erails service');
    }

    let pnrDataObj: any;
    if (typeof responseJSON.PnrData === 'string') {
      pnrDataObj = JSON.parse(responseJSON.PnrData);
    } else if (typeof responseJSON.PnrData === 'object' && responseJSON.PnrData !== null) {
      pnrDataObj = responseJSON.PnrData;
    } else {
      pnrDataObj = responseJSON;
    }

    const travelData = pnrDataObj.data || pnrDataObj;
    const resultObj: Record<string, any> = {
      status: pnrDataObj.status || 'READY',
      message: pnrDataObj.message || '',
      pnrNo: travelData.pnrNo || '',
      passengersCount: travelData.noOfPassenger || 0,
      trainDetails: this.getTrainDetails(travelData),
      travelDetails: this.getTravelDetails(travelData),
    };

    const passengerDetails = this.getPassengerDetails(
      travelData.passengerDetailsDTO || [],
      travelData.noOfPassenger || 0
    );

    resultObj.passengerDetails = passengerDetails;
    // Backward compatibility for legacy misspelled field
    resultObj.pasengerDetails = passengerDetails;

    return resultObj;
  }

  private getPassengerDetails(passengerData: any[], passengersCount: number): PassengerInfo[] {
    const passengerDetails: PassengerInfo[] = [];
    const count = Array.isArray(passengerData) ? passengerData.length : passengersCount;

    for (let i = 0; i < count; i++) {
      const responseData = passengerData[i] || {};
      passengerDetails.push({
        name: `Passenger ${i + 1}`,
        seat: 'seat',
        status: responseData.seatStts || 'UNKNOWN',
        quota: responseData.quotaCode || '',
      });
    }

    return passengerDetails;
  }

  private getTrainDetails(pnrData: any): TrainDetails {
    return {
      trainNo: pnrData.trainNum || '',
      trainName: pnrData.trainName || '',
      trainFrom: pnrData.stationFrom || '',
      trainTo: pnrData.stationTo || '',
    };
  }

  private getTravelDetails(pnrData: any): TravelDetails {
    return {
      boardingPoint: pnrData.boardingPoint || '',
      reservedUpto: pnrData.reservationUpTo || '',
      travelDate: pnrData.departureDate || '',
      travelDateString: pnrData.departureDate || '',
      ticketClass: pnrData.journeyClass || '',
      bookingStatus: pnrData.chartStts || '',
      currentStatus: pnrData.chartStts || '',
    };
  }
}

export default new ErailsService();
