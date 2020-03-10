import {Injectable} from '@angular/core';
import {ResponseContentType, Http, RequestOptions, Headers} from '@angular/http';
import {CookieService} from 'ng2-cookies';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {Party} from "../catalogue/model/publish/party";
import {UnitService} from "../common/unit-service";

@Injectable()
export class AgentService {

    SELLING_AGENT = 'SELLING_AGENT';
    BUYING_AGENT = 'BUYING_AGENT';
    private url = myGlobals.agent_mgmt_endpoint + "/api/v1/agents";
    token = 'Bearer ' + this.cookieService.get("bearer_token");
    basic_header = new Headers({'Content-Type': 'application/json', 'Authorization': this.token});


    constructor(
        private unitService: UnitService,
        private http: Http,
        private cookieService: CookieService
    ) {
    }

    createSellingAgent(sellingAgent: any): Promise<any> {
        const url = `${this.url}/createSellingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgent), {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    createBuyingAgent(sellingAgent: any): Promise<any> {
        const url = `${this.url}/createSellingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgent), {headers: this.basic_header})
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
            .get(url, {headers: this.basic_header})
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
            .get(url, {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    activateSellingAgent(sellingAgentData): Promise<any> {
        const url = `${this.url}/activateSellingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgentData), {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deactivateSellingAgent(deactivateSellingAgent): Promise<any> {
        const url = `${this.url}/activateSellingAgent`;
        return this.http
            .post(url, JSON.stringify(deactivateSellingAgent), {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    activateBuyingAgent(sellingAgentData): Promise<any> {
        const url = `${this.url}/activateBuyingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgentData), {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deactivateBuyingAgent(sellingAgentData): Promise<any> {
        const url = `${this.url}/deactivateBuyingAgent`;
        return this.http
            .post(url, JSON.stringify(sellingAgentData), {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deleteAgent(agentID, agentType): Promise<any> {
        let url = '';
        if (agentType === this.BUYING_AGENT) {
            url = `${this.url}/deleteBuyingAgent`;
        }else if (agentType === this.SELLING_AGENT) {
            url = `${this.url}/deleteSellingAgent`;
        }
        return this.http
            .post(url, JSON.stringify({id: agentID, agentType: agentType}), {headers: this.basic_header})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
