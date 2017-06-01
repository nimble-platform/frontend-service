import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { User } from './model/user';
import * as myGlobals from '../globals';
import {Party} from "../catalogue/model/publish/party";

@Injectable()
export class UserService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.endpoint;
	private userParty: Party;

	constructor(private http: Http) { }
	
	post(user: User): Promise<any> {
		const url = `${this.url}/identity/registerCompany`;
		return this.http
		.post(url, JSON.stringify(user), {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getUserParty(userId: string): Promise<Party> {
		if(this.userParty != null) {
			return Promise.resolve(this.userParty);
		}

		const url = `${this.url}/identity/party_by_person/${userId}`;
		return this.http
			.get(url, {headers: this.headers})
			.toPromise()
			.then(res => (res.json() as Party[])[0])
			.catch(this.handleError);
	}
	
	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}
	
}