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
