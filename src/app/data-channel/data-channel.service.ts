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

    //getChannelMessages(channelID: string): Promise<any> {
    //    const url = `${this.url}/channel/${channelID}/messages`;
    //    const token = 'Bearer ' + this.cookieService.get("bearer_token");
    //    const headers = new Headers({'Authorization': token});
    //    return this.http
    //        .get(url, {headers: headers, withCredentials: true})
    //        .toPromise()
    //        .then(res => res.json())
    //        .catch(this.handleError);
    //}

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

    isBusinessProcessAttached(processID: string): Promise<boolean> {
        return this.channelsForBusinessProcess(processID)
            .then(res => Object.keys(res).length > 0)
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

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

}
