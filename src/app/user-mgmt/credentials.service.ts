/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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
import { Credentials} from './model/credentials';
import { ForgotPasswordCredentials} from './model/forgot-password-credentials';
import * as myGlobals from '../globals';
import * as moment from "moment";

@Injectable()
export class CredentialsService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.user_mgmt_endpoint;
	private log_url = myGlobals.logstash_endpoint;
	constructor(private http: Http) { }

	post(credentials: Credentials): Promise<any> {
		const url = `${this.url}/login`;
		return this.http
		.post(url, JSON.stringify(credentials), {headers: this.headers, withCredentials: true})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	passwordRecoveryAction(forgotPasswordCredentials: ForgotPasswordCredentials): Promise<any> {
		const url = `${this.url}/password-recovery`;
		return this.http
			.post(url, JSON.stringify(forgotPasswordCredentials), {headers: this.headers, withCredentials: true})
			.toPromise()
			.then()
			.catch(this.handleError);
	}

	resetPassword(forgotPasswordCredentials: ForgotPasswordCredentials): Promise<any> {
		const url = `${this.url}/reset-forgot-password`;
		return this.http
			.post(url, JSON.stringify(forgotPasswordCredentials), {headers: this.headers, withCredentials: true})
			.toPromise()
			.then()
			.catch(this.handleError);
	}


	getVersionIdentity(): Promise<any> {
		const url = `${myGlobals.user_mgmt_endpoint}/info`;
		return this.http
		.get(url, {headers: this.headers, withCredentials: true})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getVersionCatalog(): Promise<any> {
		const url = `${myGlobals.catalogue_endpoint}/info`;
		return this.http
		.get(url, {headers: this.headers, withCredentials: true})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getVersionBP(): Promise<any> {
		const url = `${myGlobals.bpe_endpoint}/info`;
		return this.http
		.get(url, {headers: this.headers, withCredentials: true})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getVersionDataChannel(): Promise<any> {
		const url = `${myGlobals.data_channel_endpoint}/info`;
		return this.http
		.get(url, {headers: this.headers, withCredentials: true})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	logUrl(log: any): Promise<any> {
		const url = `${this.log_url}`;
		return this.http
		.post(url, JSON.stringify(log), {headers: this.headers})
		.toPromise()
		.then()
		.catch(this.handleError);
	}

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}

}
