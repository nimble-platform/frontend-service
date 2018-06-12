import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class TrackingService {
    // Version 1.0 for Backend..
    private tntEndpoint = 'http://nimble-staging.salzburgresearch.at/business-process/t-t/epc-details';
    private tntAnalysisEndpoint = 'http://falcon-dev2.ikap.biba.uni-bremen.de:8118/simpleTrackingAnalysis/';
    constructor(private http: Http) {}

    getMetaData(epcCode: string): Promise<any> {
        return this.http.get(`${this.tntEndpoint}?epc=${epcCode}`)
            .toPromise()
            .then(resp => resp.json());
    }

    getTrackingInfo(url: string, code: string) {
        return this.http.get(`${url}/${code}`)
            .map(resp => resp.json());
    }

    getBusinessProcessInfo(url: string) {
        return this.http.get(`${url}`)
            .map(resp => resp.json());
    }

    getAnalysisInfo(code: string) {
        return this.http.get(`${this.tntAnalysisEndpoint}${code}`)
            .map(resp => resp.json());
    }

    getGateInfo(url: string, code: string): Promise<any> {
        return this.http.get(`${url}/id/${code}`)
            .toPromise()
            .then(resp => resp.json());
    }

    getSubSiteTypeInfo(url: string, code: string): Promise<any> {
        return this.http.get(`${url}/type/urn:epcglobal:epcis:vtype:SubSiteType/id/${code}`)
            .toPromise()
            .then(resp => resp.json());
    }
}
