import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Order } from './model/order';
import * as myGlobals from '../globals';

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.endpoint;
	
	constructor(private http: Http) { }

	placeOrder(order: Order): Promise<any> {
		const url = `${this.url}/business-process/rest/engine/default/process-definition/key/Order/start`;
		var jsonToSend = {
			"variables": {},
			"businessKey" : ""
		}
		for (let order_var in order) {
			jsonToSend.variables[order_var] = {
				"value":order[order_var],
				"type":"String"
			}
		}
		return this.http
		.post(url, JSON.stringify(jsonToSend), {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getOrders(id: string): Promise<any> {
		const url = `${this.url}/business-process/rest/engine/default/task?processVariables=connection_like_%|${id}|%`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getProcessDetails(id: string): Promise<any> {
		const url = `${this.url}/business-process/rest/engine/default/variable-instance?processInstanceId=${id}`;
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