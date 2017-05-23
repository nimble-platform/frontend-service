/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import * as myGlobals from '../globals';
import {GoodsItem} from "./model/publish/goods-item";

@Injectable()
export class CatalogueService {
    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.endpoint;

    constructor(private http: Http) {
    }

    publishProduct(goodsItem: GoodsItem): Promise<any> {
        //const url = `${this.url}/catalogue/product`;
        // TODO remove the hardcoded URL
        const url = `http://localhost:8095/catalogue/product`;
        return this.http
            .post(url, JSON.stringify(goodsItem), {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}