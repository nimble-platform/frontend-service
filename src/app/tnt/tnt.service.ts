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
import { Http, Headers, RequestOptions } from '@angular/http';
import * as myGlobals from '../globals';
import { CookieService } from 'ng2-cookies';

@Injectable()
export class TnTService {
    private tntEndpoint = myGlobals.tntEndpoint;
    private tntMasterDataEndpoint = myGlobals.tntMasterDataEndpoint;
    private iotBlockchainEndpoint = myGlobals.tntIoTBlockchainEndpoint;

    constructor(private http: Http,
        private cookieService: CookieService) { }

    /**
     * getMetaData: Acquire EPCIS Meta Data
     * @param epcCode: string
     */
    async getMetaData(epcCode: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({ headers: header });
        const resp = await this.http.get(`${this.tntEndpoint}/simpleTracking/${epcCode}`, reqOptions)
            .toPromise();
        return resp.json();
    }

    /**
     * getTrackingInfo: Get all EPC Event Data for Tracking and Tracing
     * @param code string
     */
    async getTrackingInfo(code: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({ headers: header });
        const resp = await this.http.get(`${this.tntMasterDataEndpoint}${code}`, reqOptions)
            .toPromise();
        return resp.json()

    }

    /**
     * getGateInfo: Get the EPCIS Vocabulary for Reader's Gate
     * @param code string
     */
    async getGateInfo(code: string): Promise<any> {
        const token = 'Bearer ' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Content-Type', 'application/json');
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({ headers: header });
        const resp = await this.http.get(`${this.tntMasterDataEndpoint}${code}`, reqOptions)
            .toPromise();
        return resp.json();
    }

    /**
     * verifyOnBC: Check if Event Data is stored in Blockchain and its integrity is maintained with Blockchain
     * @param code string
     */
    async verifyOnBC(code: any): Promise<string> {
        let token = 'Bearer' + this.cookieService.get('bearer_token');
        let header = new Headers();
        header.append('Authorization', token);
        let reqOptions = new RequestOptions({ headers: header });
        const resp = await this.http.post(`${this.tntEndpoint}/verifyEventsInBlockChain`, code, reqOptions)
            .toPromise();
        return resp.text();
    }

    /**
     * verifyIOTBC: Check if hashes for IoT Data are stored in Blockchain and check their integrity with Blockchain
     * @param input object: {productID: string, from: string, to: string}
     */
    async verifyIOTBC(input: object): Promise<any> {
        let verifyQuery = `?productID=${input['productID']}&from=${input['from']}&to=${input['to']}`;
        const resp = await this.http.get(`${this.iotBlockchainEndpoint}${verifyQuery}`)
            .toPromise();
        return resp.json();
    }
}
