import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { User } from './model/user';
import * as myGlobals from '../globals';
import {Party} from "../catalogue/model/publish/party";
import { CompanySettings } from './model/company-settings';
import {Observable} from "rxjs/Observable";
import {toPromise} from "rxjs/operator/toPromise";

@Injectable()
export class UserService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.user_mgmt_endpoint;

	userParty: Party;

	constructor(private http: Http) { }

	post(user: User): Promise<any> {
		const url = `${this.url}/registerCompany`;
		return this.http
		.post(url, JSON.stringify(user), {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getParty(partyId:string):Promise<Party> {
		const url = `${this.url}/party/${partyId}`;
		return this.http
            .get(url, {headers: this.headers})
			.toPromise()
            .catch(err => {
            	if(err.status == 302) {
					// ToDo: make identity service using the latest version of the data model
					let party:Party = new Party(null, err.json().id, err.json().partyName[0].name, null);
					return Promise.resolve(party);
				} else {
            		return this.handleError(err);
				}
            });
	}

	getUserParty(userId: string): Promise<Party> {
		if(this.userParty != null) {
			return Promise.resolve(this.userParty);
		}
		const url = `${this.url}/party_by_person/${userId}`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => {
			// ToDo: make identity service using the latest version of the data model
			this.userParty = new Party(null, res.json()[0].hjid, res.json()[0].partyName[0].name, null);
			return Promise.resolve(this.userParty);
		})
		.catch(this.handleError);
	}

    getSettings(userId: string): Promise<CompanySettings> {

        return this.getUserParty(userId).then(party => {
            const url = `${this.url}/company-settings/${party.id}`;
            return this.http
                .get(url, {headers: this.headers})
                .toPromise()
                .then(response => response.json() as CompanySettings)
                .catch(this.handleError)
        });
    }

	putSettings(settings: CompanySettings, userId: string): Promise<any> {
		return this.getUserParty(userId).then(party => {
			const url = `${this.url}/company-settings/${party.id}`;
			return this.http
                .put(url, settings, {headers: this.headers})
                .toPromise()
                .then(response => response.json())
                .catch(this.handleError)
		});
	}

	resetData():void {
		this.userParty = null;
	}

	private handleError(error: any): Promise<any> {
		console.error('An error occurred', error); // for demo purposes only
		return Promise.reject(error.message || error);
	}

}