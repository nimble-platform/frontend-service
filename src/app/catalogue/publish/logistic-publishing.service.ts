import {Injectable} from '@angular/core';
import {getAuthorizedHeaders} from '../../common/utils';
import {Headers, Http} from '@angular/http';
import {CookieService} from 'ng2-cookies';
import * as myGlobals from '../../globals';

@Injectable()
export class LogisticPublishingService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint;
    private url = myGlobals.indexing_service_endpoint;

    constructor(private http: Http,
                private cookieService: CookieService) {
    }

    // maps to store cached values
    private propertyCodeListMap = new Map();
    private propertyMap = new Map();
    private logisticRelatedServices = new Map();

    // methods to retrieve cached values
    getCachedPropertyCodeList(uri:string): Promise<any> {
        if(this.propertyCodeListMap.has(uri)){
            return Promise.resolve(this.propertyCodeListMap.get(uri));
        }
        else{
            return this.getPropertyCodeList(uri);
        }
    }

    getCachedProperty(uri:string): Promise<any> {
        if(this.propertyMap.has(uri)){
            return Promise.resolve(this.propertyMap.get(uri));
        }
        else{
            return this.getProperty(uri);
        }
    }

    getCachedLogisticRelatedServices(taxonomyId:string): Promise<any> {
        if(this.logisticRelatedServices.has(taxonomyId)){
            return Promise.resolve(this.logisticRelatedServices.get(taxonomyId));
        }
        else{
            return this.getLogisticRelatedServices(taxonomyId);
        }
    }


    private getLogisticRelatedServices(taxonomyId:string):Promise<any>{
        const url = `${this.baseUrl}/taxonomies/${taxonomyId}/logistics-services`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                let logisticRelatedServices = res.json();
                // add property to the map
                this.logisticRelatedServices.set(taxonomyId,logisticRelatedServices);
                return logisticRelatedServices;
            })
            .catch(this.handleError);
    }

    private getProperty(uri:string){
        let url = this.url + `/property?uri=${encodeURIComponent(uri)}`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                let property = res.json();
                // add property to the map
                this.propertyMap.set(uri,property);
                return property;
            })
            .catch(this.handleError);
    }

    private getPropertyCodeList(uri:string){
        const url = this.url + `/code/select?q=codedList:"${encodeURIComponent(uri)}"`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                let propertyCodeList = res.json();
                // add property code list to the map
                this.propertyCodeListMap.set(uri,propertyCodeList);
                return propertyCodeList;
            })
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

}
