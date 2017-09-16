import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {RequestForQuotation} from "./model/ubl/request-for-quotation";
import {RequestForQuotationResponse} from "./model/ubl/request-for-quotation-response";
import {ProcessInstanceInputMessage} from "./model/process-instance-input-message";
import {ProcessInstance} from "./model/process-instance";
import {OrderResponseSimple} from "./model/ubl/order-response-simple";

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.bpe_endpoint;
	
	constructor(private http: Http) { }

	startBusinessProcess(piim:ProcessInstanceInputMessage):Promise<ProcessInstance> {
		const url = `${this.url}/start`;
		return this.http
            .post(url, JSON.stringify(piim), {headers: this.headers})
            .toPromise()
            .then(res => {
				console.log(res.json());
            	return res.json();
            })
            .catch(this.handleError);
	}

	continueBusinessProcess(piim:ProcessInstanceInputMessage):Promise<ProcessInstance> {
		const url = `${this.url}/continue`;
		return this.http
            .post(url, JSON.stringify(piim), {headers: this.headers})
            .toPromise()
            .then(res => {
				console.log(res.json());
				return res.json();
			})
            .catch(this.handleError);
	}

	respondToOrder(task: string, orderResponse: OrderResponseSimple): Promise<any> {
		const url = `${this.url}/rest/engine/default/task/${task}/complete`;
		var jsonToSend = {
			"variables": {
				"orderResponse": {
					"value": JSON.stringify(orderResponse),
					"type": "String"
				}
			},
			"businessKey" : ""
		}
		return this.http
		.post(url, JSON.stringify(jsonToSend), {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getProcessDetails(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/variable-instance?processInstanceIdIn=${id}`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getInitiatorHistory(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/task?processVariables=initiatorID_eq_${id}&sortBy=startTime&sortOrder=desc&maxResults=10`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getRecipientHistory(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/task?processVariables=responderID_eq_${id}&sortBy=startTime&sortOrder=desc&maxResults=10`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getProcessDetailsHistory(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/variable-instance?processInstanceIdIn=${id}`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	sendRfq(rfq: RequestForQuotation): Promise<any> {
		const url = `${this.url}/rest/engine/default/process-definition/key/Negotiation/start`;
		var jsonToSend = {
			"variables": {},
			"businessKey" : ""
		}
		for (let rfq_var in rfq) {
			jsonToSend.variables[rfq_var] = {
				"value":rfq[rfq_var],
				"type":"String"
			}
		}
		return this.http
            .post(url, JSON.stringify(jsonToSend), {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    respondToRFQ(task: string, rfqResponse: RequestForQuotationResponse): Promise<any> {
        const url = `${this.url}/rest/engine/default/task/${task}/complete`;
        var jsonToSend = {
            "variables": {
                "rfqResponse": {
                    "value": JSON.stringify(rfqResponse),
                    "type": "String"
                }
            },
            "businessKey": ""
        }
        return this.http
            .post(url, JSON.stringify(jsonToSend), {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

	getDocumentJsonContent(documentId:string):Promise<string> {
		const url = `${this.url}/document/json/${documentId}`;
		return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}
}