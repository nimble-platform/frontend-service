import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
export class TrackingService {
    // Version 1.0 for Backend..
    private tntEndpoint = 'http://nimble-staging.salzburgresearch.at/business-process/t-t/epc-details';
    constructor(private http: Http) {}

    getMetaData(epcCode: string): Promise<any> {
        return this.http.get(`${this.tntEndpoint}?epc=${epcCode}`)
            .toPromise()
            .then(resp => resp.json());
    }
}
