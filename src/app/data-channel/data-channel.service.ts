import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {CookieService} from 'ng2-cookies';
import {Sensor} from './model/sensor';
import {Server} from './model/server';

@Injectable()
export class DataChannelService {

    private url = myGlobals.data_channel_endpoint;

    constructor(private http: Http,private cookieService: CookieService) {}

    isBusinessProcessAttached(processID: string): Promise<boolean> {
        return this.channelsForBusinessProcess(processID)
            .then(res => Object.keys(res).length > 0)
    }

     private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
     }

    //-------------------------------------------------------------------------------------
    // GET - Requests
    //-------------------------------------------------------------------------------------
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

    getAssociatedSensors(channelID: string): Promise<any> {
        const url = `${this.url}/channel/${channelID}/sensors`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .get(url, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getAssociatedServers(channelID: string): Promise<any> {
         const url = `${this.url}/channel/${channelID}/servers`;
         const token = 'Bearer ' + this.cookieService.get("bearer_token");
         const headers = new Headers({'Authorization': token});
         return this.http
             .get(url, {headers: headers, withCredentials: true})
             .toPromise()
             .then(res => res.json())
             .catch(this.handleError);
    }

    getInternalService(): Promise<any> {
         const url = `${this.url}/channel/hasInternalService`;
         const token = 'Bearer ' + this.cookieService.get("bearer_token");
         const headers = new Headers({'Authorization': token});
         return this.http
             .get(url, {headers: headers, withCredentials: true})
             .toPromise()
             .then(res => res.json())
             .catch(this.handleError);
    }

    getFilteringService(): Promise<any> {
         const url = `${this.url}/channel/hasFilteringService`;
         const token = 'Bearer ' + this.cookieService.get("bearer_token");
         const headers = new Headers({'Authorization': token});
         return this.http
             .get(url, {headers: headers, withCredentials: true})
             .toPromise()
             .then(res => res.json())
             .catch(this.handleError);
    }

    //-------------------------------------------------------------------------------------
    // POST - Requests
    //-------------------------------------------------------------------------------------
    addSensor(channelID: string, sensor: Sensor): Promise<any> {
        const url = `${this.url}/channel/${channelID}/sensor`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, sensor, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    addServersForChannel(channelID: string, server: Server): Promise<any> {
        const url = `${this.url}/channel/${channelID}/server`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, server, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    // TODO: add body here containing businessProcessID, buyerCompanyID, description and sellerCompanyID
    createChannel(channelID: string): Promise<any> {
        const url = `${this.url}/channel/`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, null, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    startChannel(channelID: string): Promise<any> {
        const url = `${this.url}/channel/${channelID}/start`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, null, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    closeChannel(channelID: string): Promise<any> {
        const url = `${this.url}/channel/${channelID}/close`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, null, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    doNegotiationStep(channelID: string, usePrivateServers: boolean,
                      sellerMessage: string, buyerMessage: string,
                      sellerServerType: string, buyerServerType: string): Promise<any> {

        const url = `${this.url}/channel/${channelID}/doNegotiationStep` +
        `?usePrivateServers=${usePrivateServers}&sellerMessage=${sellerMessage}&buyerMessage=${buyerMessage}` +
        `&sellerServerType=${sellerServerType}&buyerServerType=${buyerServerType}`;

        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, null, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getChannelConfigFromNegotiationStep(channelID: string, stepNumber: number): Promise<any> {
        const url = `${this.url}/channel/${channelID}/getChannelFromNegotiationStep/${stepNumber}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, null, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    renegotiate(channelID: string, numberOfSteps: number): Promise<any> {
        const url = `${this.url}/channel/${channelID}/renegotiate/${numberOfSteps}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .post(url, null, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    //setAdvancedConfig(channelID: string, usePrivateServers: boolean, additionalNotes: string,
    //                  privateServersType: string, hostRequest: boolean): Promise<any> {
    //
    //    const url = `${this.url}/channel/${channelID}/setAdvancedConfig?usePrivateServers=${usePrivateServers}&privateServersType=${privateServersType}&hostRequest=${hostRequest}&additionalNotes=${additionalNotes}`;
    //
    //    const token = 'Bearer ' + this.cookieService.get("bearer_token");
    //    const headers = new Headers({'Authorization': token});
    //    return this.http
    //        .post(url, null, {headers: headers, withCredentials: true})
    //        .toPromise()
    //        .then(res => res.json())
    //        .catch(this.handleError);
    //}

    //-------------------------------------------------------------------------------------
    // DELETE - Requests
    //-------------------------------------------------------------------------------------
    removeSensor(channelID: string, sensor: Sensor): Promise<any> {
        const url = `${this.url}/channel/${channelID}/sensors/${sensor.id}`;
        const token = 'Bearer ' + this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        return this.http
            .delete(url, {headers: headers, withCredentials: true})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    removeServerForChannel(channelID: string, server: Server): Promise<any> {
         const url = `${this.url}/channel/${channelID}/server/${server.id}`;
         const token = 'Bearer ' + this.cookieService.get("bearer_token");
         const headers = new Headers({'Authorization': token});
         return this.http
             .delete(url, {headers: headers, withCredentials: true})
             .toPromise()
             .then(res => res.json())
             .catch(this.handleError);
    }
}
