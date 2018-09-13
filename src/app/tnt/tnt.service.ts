import { Injectable } from '@angular/core';
import { Http, URLSearchParams, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as myGlobals from '../globals';
import 'rxjs/add/operator/map';
import {CookieService} from 'ng2-cookies';

@Injectable()
export class TnTService {
    // Version 1.0 for Backend..
    private tntEndpoint = myGlobals.tntEndpoint;
    private tntAnalysisEndpoint = myGlobals.tntAnalysisEndpoint;
    constructor(private http: Http,
                private cookieService: CookieService) {}

    getMetaData(epcCode: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let params = new URLSearchParams();
        params.append('epc', epcCode);
        let reqOptions = new RequestOptions({headers: header, params: params});

        return this.http.get(`${this.tntEndpoint}`, reqOptions)
            .toPromise()
            .then(resp => resp.json());
    }

    getTrackingInfo(url: string, code: string) {
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        let params = new URLSearchParams();
        params.append('epc', code);
        let reqOptions = new RequestOptions({headers: header, params: params});
        return this.http.get(`${url}`, reqOptions)
            .map(resp => resp.json());
    }

    getBusinessProcessInfo(url: string) {
        return this.http.get(`${url}`)
            .map(resp => resp.json());
    }

    getAnalysisInfo(code: string) {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.tntAnalysisEndpoint}/${code}`, reqOptions)
            .map(resp => resp.json());
    }

    getGateInfo(url: string, code: string): Promise<any> {
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        let params = new URLSearchParams();
        params.append('id', code);
        let reqOptions = new RequestOptions({headers: header, params: params});
        return this.http.get(`${url}`, reqOptions)
            .toPromise()
            .then(resp => resp.json());
    }

    getSubSiteTypeInfo(url: string, code: string): Promise<any> {
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        let params = new URLSearchParams();
        params.append('type', 'urn:epcglobal:epcis:vtype:SubSiteType');
        params.append('id', code);
        let reqOptions = new RequestOptions({headers: header, params: params});
        return this.http.get(`${url}`, reqOptions)
            .toPromise()
            .then(resp => resp.json());
    }
}
