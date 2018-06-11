import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {CookieService} from 'ng2-cookies';

@Injectable()
export class DataChannelService {

    private url = myGlobals.data_channel_endpoint;


    constructor(
        private http: Http,
        private cookieService: CookieService
    ) {
    }

    getChannelConfig(channelID: string): Promise<any> {
        const url = `${this.url}/channel/${channelID}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .get(url, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getChannelMessages(channelID: string): Promise<any> {
        const url = `${this.url}/channel/${channelID}/messages`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .get(url, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    channelsForBusinessProcess(processID: string): Promise<any> {

        const url = `${this.url}/channel/business-process/${processID}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .get(url, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    isChannelAttached(processID: string): Promise<boolean> {
        return this.channelsForBusinessProcess(processID)
            .then(res => Object.keys(res).length > 0)
    }

    deleteChannel(channelID: string): Promise<any> {
        const url = `${this.url}/channel/${channelID}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .delete(url, {headers: headers, withCredentials: true})
            .toPromise()
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

}
