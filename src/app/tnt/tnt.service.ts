import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as myGlobals from '../globals';

@Injectable()
export class TnTService {
    // Version 1.0 for Backend..
    private tntEndpoint = myGlobals.tntEndpoint;
    private tntAnalysisEndpoint = myGlobals.tntAnalysisEndpoint;
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
