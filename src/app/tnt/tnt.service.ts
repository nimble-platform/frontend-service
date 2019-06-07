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
    private tntMasterDataEndpoint = myGlobals.tntMasterDataEndpoint;
    private basePath = myGlobals.base_path;
    constructor(private http: Http,
                private cookieService: CookieService) {}

    getMetaData(epcCode: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        // let params = new URLSearchParams();
        // params.append('epc', epcCode);
        // let reqOptions = new RequestOptions({headers: header, params: params});
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.tntEndpoint}/simpleTracking/${epcCode}`, reqOptions)
            .toPromise()
            .then(resp => resp.json());
    }

    getTrackingInfo(code: string) {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.tntMasterDataEndpoint}${code}`, reqOptions)
            .map(resp => resp.json());
    }

    getGateInfo(code: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.get(`${this.tntMasterDataEndpoint}${code}`, reqOptions)
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

    verifyOnBC(code: any): Promise<boolean> {
        let token = 'Bearer' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Authorization', token);
        // let params = new URLSearchParams();
        // params.append('jsonEventArray', code);
        let reqOptions = new RequestOptions({headers: header});
        return this.http.post(`${this.tntEndpoint}/verifyEventsInBlockChain`, code, reqOptions)
            .toPromise()
            .then(resp => resp.json());
    }
}
