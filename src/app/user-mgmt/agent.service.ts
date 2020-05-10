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
import { ResponseContentType, Http, RequestOptions, Headers } from '@angular/http';
import { CookieService } from 'ng2-cookies';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import { Party } from "../catalogue/model/publish/party";
import { UnitService } from "../common/unit-service";

@Injectable()
export class AgentService {

    SELLING_AGENT = 'SELLING_AGENT';
    BUYING_AGENT = 'BUYING_AGENT';
    private url = myGlobals.agent_mgmt_endpoint;
    token = 'Bearer ' + this.cookieService.get("bearer_token");
    basic_header = new Headers({ 'Content-Type': 'application/json', 'Authorization': this.token });


    constructor(
        private unitService: UnitService,
        private http: Http,
        private cookieService: CookieService
    ) {
    }

    createSellingAgent(sellingAgent: any): Promise<any> {
        const url = `${this.url}/createSellingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgent), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    updateSellingAgent(sellingAgent: any): Promise<any> {
        const url = `${this.url}/updateSellingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgent), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    createBuyingAgent(buyingAgent: any): Promise<any> {
        const url = `${this.url}/createBuyingAgent`;
        return this.http
            .post(url, JSON.stringify(buyingAgent), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    updateBuyingAgent(buyingAgent: any): Promise<any> {
        const url = `${this.url}/updateBuyingAgent`;
        return this.http
            .post(url, JSON.stringify(buyingAgent), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getAllSellingAgents(id?): Promise<any> {
        let ownerCompanyId = id;
        if (id === undefined) {
            ownerCompanyId = this.cookieService.get("company_id");
        }
        const url = `${this.url}/getAllSellingAgents/${ownerCompanyId}`;
        return this.http
            .get(url, { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getSAOrders(agentId?): Promise<any> {
        const url = `${this.url}/getSAOrders/${agentId}`;
        return this.http
            .get(url, { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getBAOrders(agentId?): Promise<any> {
        const url = `${this.url}/getBAOrders/${agentId}`;
        return this.http
            .get(url, { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getAllBuyingAgents(id?): Promise<any> {
        let ownerCompanyId = id;
        if (id === undefined) {
            ownerCompanyId = this.cookieService.get("company_id");
        }
        const url = `${this.url}/getAllBuyingAgents/${ownerCompanyId}`;
        return this.http
            .get(url, { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    activateSellingAgent(sellingAgentData): Promise<any> {
        const url = `${this.url}/activateSellingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgentData), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deactivateSellingAgent(deactivateSellingAgent): Promise<any> {
        const url = `${this.url}/deactivateSellingAgent`;
        return this.http
            .post(url, JSON.stringify(deactivateSellingAgent), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    activateBuyingAgent(sellingAgentData): Promise<any> {
        const url = `${this.url}/activateBuyingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgentData), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deactivateBuyingAgent(buyingAgentData): Promise<any> {
        const url = `${this.url}/deactivateBuyingAgent`;
        return this.http
            .post(url, JSON.stringify(buyingAgentData), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deactivateAllAgents(id): Promise<any> {
        let ownerCompanyId = id;
        if (id === undefined) {
            ownerCompanyId = this.cookieService.get("company_id");
        }
        const url = `${this.url}/deactivateAllAgents/${ownerCompanyId}`;
        return this.http
            .post(url, {}, { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deleteAgent(agentID, agentType): Promise<any> {
        let url = `${this.url}/deleteAgent`;
        return this.http
            .post(url, JSON.stringify({ id: agentID, agentType: agentType }), { headers: this.basic_header })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
