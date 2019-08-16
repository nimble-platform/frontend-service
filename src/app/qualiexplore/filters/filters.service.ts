import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()

export class FiltersService {

    private _filtersUrl = 'https://gist.githubusercontent.com/shantanoo-desai/02fcc931da4aed4db3eac7d53dd5f5c4/raw/Filters.json';

    constructor(private http: Http) {}

      getQuestions() {
        return this.http.get(this._filtersUrl)
            .toPromise()
            .then(response => response.json())
            .catch(err => {console.log(err)});
    }
}
