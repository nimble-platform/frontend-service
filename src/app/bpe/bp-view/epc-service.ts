import { Injectable } from '@angular/core';
import {Headers, Http} from '@angular/http';
import * as myGlobals from '../../globals';
import {CookieService} from 'ng2-cookies';
import {EpcCodes} from '../../data-channel/model/epc-codes';

@Injectable()
export class EpcService {
    constructor(private http: Http,
                private cookieService: CookieService) {}

    private dataChannelEndpoint = myGlobals.data_channel_endpoint;

    registerEpcCodes(epcCodes: EpcCodes): Promise<any>{
        const url = `${this.dataChannelEndpoint}/epc/`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});
        return this.http
            .post(url, JSON.stringify(epcCodes), {headers: headers_token, withCredentials: true})
            .toPromise()
            .catch(this.handleError);
    }

    getEpcCodes(orderId): Promise<any>{
        const url = `${this.dataChannelEndpoint}/epc/${orderId}`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Authorization': token});
        return this.http
            .get(url, {headers: headers_token, withCredentials: true})
            .toPromise()
            .then(res => res.json());
    }

    deleteEpcCodes(epcCodes: EpcCodes): Promise<any>{
        const url = `${this.dataChannelEndpoint}/epc/`;
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers_token = new Headers({'Content-Type': 'application/json', 'Authorization': token});

        let options = {
            headers:headers_token,
            body:JSON.stringify(epcCodes)
        };
        return this.http
            .delete(url,options)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private handleError(error: any) {
        let errorMsg = error.message;
        console.error(errorMsg);
    }
}
