/**
 * Copyright 2020
 * University of Bremen, Faculty of Production Engineering, Badgasteiner Straße 1, 28359 Bremen, Germany.
 * In collaboration with BIBA - Bremer Institut für Produktion und Logistik GmbH, Bremen, Germany.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()

export class FiltersService {

    private _filtersUrl = 'https://gist.githubusercontent.com/shantanoo-desai/02fcc931da4aed4db3eac7d53dd5f5c4/raw/Filters.json';

    constructor(private http: Http) { }

    async getQuestions() {
        try {
            const response = await this.http.get(this._filtersUrl)
                .toPromise();
            return response.json();
        } catch (err) {
            console.log(err);
        }
    }
}
