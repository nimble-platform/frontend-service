/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';

@Injectable()
export class CatalogueService {
    private headers = new Headers({'Accept': 'application/json'});
    // TODO remove the hardcoded URL
    //private url = myGlobals.endpoint;
    private url = `http://localhost:8095/catalogue/category`;

    constructor(private http: Http) {
    }

    publishProduct(keyword: string): void {

    }
}