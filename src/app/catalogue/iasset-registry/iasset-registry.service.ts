/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../../globals';
import { CookieService } from 'ng2-cookies';
import { ModelAssetType } from "./model/model-asset-type";
import { ModelAssetInstance } from "./model/model-asset-instance";

@Injectable()
export class AssetRegistryService {

    private url = myGlobals.iasset_registry_endpoint;

    constructor(private http: Http, private cookieService: CookieService) {}

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }


/*
    isBusinessProcessAttached(processID: string): Promise<boolean> {
            return this.channelsForBusinessProcess(processID)
                .then(res => Object.keys(res).length > 0)
    }
*/

    //-------------------------------------------------------------------------------------
    // GET - Requests
    //-------------------------------------------------------------------------------------
    // TODO

    //-------------------------------------------------------------------------------------
    // POST - Requests
    //-------------------------------------------------------------------------------------
    // TODO

    //-------------------------------------------------------------------------------------
    // DELETE - Requests
    //-------------------------------------------------------------------------------------
    // TODO
}
