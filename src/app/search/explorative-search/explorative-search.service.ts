import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../../globals';

@Injectable()

export class ExplorativeSearchService {
    private url = myGlobals.endpoint;
    private headers = new Headers();

    constructor(private http: Http) {
        this.headers.append('Access-Control-Allow-Origin', '*');
        this.headers.append('Accept', 'application/json,text/*,*/*');
    }

    searchData(term: string): Promise<string> {
        return this.http.get(`${this.url}?keyword=${term}`, {headers: this.headers})
            .toPromise()
            .then(res => res.json());
    }
}
