import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { TreeviewItem } from 'ngx-treeview';

@Injectable()

export class FactorsService {
    private _factorsUrl = 'https://gist.githubusercontent.com/shantanoo-desai/5163182aba74baf7ec04d7ac426bd944/raw/Data.json';

    constructor(private http: Http) {}

    getFactors() {
        return this.http.get(this._factorsUrl)
            .toPromise()
            .then(response => response.json())
            .catch(err => console.log(err));
    }
}
