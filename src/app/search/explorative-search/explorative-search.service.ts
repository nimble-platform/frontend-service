/**
 * This is the Service File for the Explorative Search Component.
 * We Inject a simple HTTP GET Service which will perform a GET on
 * the User's keyword input to the backend server.
 * And return the response in JSON for further parsing.
 */

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../../globals';

@Injectable()

export class ExplorativeSearchService {
    private url = myGlobals.endpoint;

    constructor(private http: Http) { }
    // This is where the HTTP GET service is performed
    // for keyword search from user
    searchData(term: string): Promise<string> {
        return this.http.get(`${this.url}?keyword=${term}`)
            .toPromise()
            .then(res => res.json());
    }
}
