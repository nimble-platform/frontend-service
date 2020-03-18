/**
 * Copyright 2020
 * University of Bremen, Faculty of Production Engineering, Badgasteiner Straße 1, 28359 Bremen, Germany.
 * In collaboration with BIBA - Bremer Institut für Produktion und Logistik GmbH, Bremen, Germany.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

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
    private iotBlockchainEndpoint = myGlobals.tntIoTBlockchainEndpoint;
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

    async verifyOnBC(code: any): Promise<string> {
        let token = 'Bearer' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Authorization', token);
        // let params = new URLSearchParams();
        // params.append('jsonEventArray', code);
        let reqOptions = new RequestOptions({headers: header});
        const resp = await this.http.post(`${this.tntEndpoint}/verifyEventsInBlockChain`, code, reqOptions)
            .toPromise();
        return resp.text();
    }

    // IoT Sensor Data + Blockchain Service

    verifyIOTBC(input: object): Promise<any> {
        // console.log(duration);
        let verifyQuery = `?productID=${input['productID']}&from=${input['from']}&to=${input['to']}`;
        return this.http.get(
            `${this.iotBlockchainEndpoint}${verifyQuery}`)
            .toPromise()
            .then(resp => resp.json());
    }
}
