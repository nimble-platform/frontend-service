import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { OrderObject } from './model/order-object';
import { OrderResponse } from './model/order-response';
import * as myGlobals from '../globals';
import {RequestForQuotation} from "./model/request-for-quotation";
import {RequestForQuotationResponse} from "./model/request-for-quotation-response";

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.bpe_endpoint;
	
	constructor(private http: Http) { }

	placeOrder(orderObject: OrderObject): Promise<any> {
		const url = `${this.url}/rest/engine/default/process-definition/key/Order/start`;
		var jsonToSend = {
			"variables": {},
			"businessKey" : ""
		}
		for (let order_var in orderObject) {
			jsonToSend.variables[order_var] = {
				"value":orderObject[order_var],
				"type":"String"
			}
		}
		return this.http
		.post(url, JSON.stringify(jsonToSend), {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	respondToOrder(task: string, orderResponse: OrderResponse): Promise<any> {
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
	
	removeOrder(process: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/process-instance/${process}`;
		return this.http
		.delete(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	cancelOrder(process: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/process-instance/${process}`;
		return this.http
		.delete(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getOrders(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/task?sortBy=created&sortOrder=desc&processVariables=connection_like_%|${id}|%`;
		return this.http
		.get(url, {headers: this.headers})
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
	
	getBuyerHistory(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/task?processVariables=buyer_eq_${id}&sortBy=startTime&sortOrder=desc&maxResults=10`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getSellerHistory(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/task?processVariables=seller_eq_${id}&sortBy=startTime&sortOrder=desc&maxResults=10`;
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
			"businessKey" : ""
		}
		return this.http
            .post(url, JSON.stringify(jsonToSend), {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}
	
}