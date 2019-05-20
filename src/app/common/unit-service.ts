import {Injectable} from '@angular/core';
import * as myGlobals from '../globals';
import {Headers, Http} from '@angular/http';
import {getAuthorizedHeaders} from "../common/utils";
import {CookieService} from "ng2-cookies";
import {ServiceBridge} from "./ServiceBridge";

@Injectable()
export class UnitService{
    private baseUrl = myGlobals.catalogue_endpoint;

    constructor(private http: Http,
                private cookieService: CookieService) {
        ServiceBridge.unitService = this;
    }

    private map = null;

    getCachedUnitList(unitListId): Promise<any> {
        if(this.map){
            return Promise.resolve(this.map.get(unitListId));
        }
        else{
            return this.getAllUnitList().then(res => {
                return this.map.get(unitListId);
            });
        }
    }

    getUnitList(unitListId): Promise<any> {
        let url = this.baseUrl + `/unit-lists/${unitListId}`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);
    }

    getAllUnitList(): Promise<any>{
        let url = this.baseUrl + '/unit-lists';
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                let unitLists = res.json();

                // create the map
                this.map = new Map();
                for(let unitList of unitLists){
                    this.map.set(unitList.unitListId,unitList.units);
                }
                return unitLists;
            })
            .catch(this.handleError);
    }

    addUnitToList(unit,unitListId): Promise<any>{
        let url = this.baseUrl + `/unit-lists/${unitListId}?unit=${unit}`;
        return this.http
            .patch(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                let result = res.json();
                // update map
                this.map.set(unitListId,result);
                return result;
            })
            .catch(this.handleError);
    }

    deleteUnitFromList(unit,unitListId): Promise<any>{
        let url = this.baseUrl + `/unit-lists/${unitListId}/unit/${unit}`;
        return this.http
            .delete(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                let result = res.json();
                // update map
                this.map.set(unitListId,result);
                return result;
            })
            .catch(this.handleError);
    }

    addUnitList(units:string[],unitListId): Promise<any>{
        let url = this.baseUrl + `/unit-lists?unitListId=${unitListId}&units=${units}`;
        return this.http
            .post(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                let result = res.json();
                // update map
                this.map.set(unitListId,units);
                return result;
            })
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}