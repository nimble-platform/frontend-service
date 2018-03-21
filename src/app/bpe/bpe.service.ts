import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {ProcessInstanceInputMessage} from "./model/process-instance-input-message";
import {ProcessInstance} from "./model/process-instance";
import {ProcessInstanceGroup} from "./model/process-instance-group";
import {BPDataService} from "./bp-view/bp-data-service";
import {ProcessInstanceGroupResponse} from "./model/process-instance-group-response";

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.bpe_endpoint;

	constructor(private http: Http,
				private bpDataService:BPDataService) { }

	startBusinessProcess(piim:ProcessInstanceInputMessage):Promise<ProcessInstance> {
		let url = `${this.url}/start`;
		if(this.bpDataService.getRelatedGroupId() != null) {
			url += '?gid=' + this.bpDataService.getRelatedGroupId();
		}

		return this.http
            .post(url, JSON.stringify(piim), {headers: this.headers})
            .toPromise()
            .then(res => {
				if (myGlobals.debug)
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
				if (myGlobals.debug)
					console.log(res.json());
				return res.json();
			})
            .catch(this.handleError);
	}
	
	cancelBusinessProcess(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/process-instance/${id}`;
		return this.http
		.delete(url, {headers: this.headers})
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
		const url = `${this.url}/rest/engine/default/history/task?processVariables=initiatorID_eq_${id}&sortBy=startTime&sortOrder=desc&maxResults=20`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getRecipientHistory(id: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/task?processVariables=responderID_eq_${id}&sortBy=startTime&sortOrder=desc&maxResults=20`;
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

	getLastActivityForProcessInstance(processInstanceId: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/activity-instance?processInstanceId=${processInstanceId}&sortBy=startTime&sortOrder=desc&maxResults=1`;
		return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json()[0])
            .catch(this.handleError);
	}

	getProcessInstanceDetails(processInstanceId: string): Promise<any> {
		const url = `${this.url}/rest/engine/default/history/process-instance/${processInstanceId}`;
		return this.http
            .get(url, {headers: this.headers})
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

	// getProcessInstanceGroups(partyId:string): Promise<ProcessInstanceGroup[]> {
	// 	const url = `${this.url}/group/temp`;
	// 	return this.http
     //        .get(url, {headers: this.headers})
     //        .toPromise()
     //        .then(res => res.json())
     //        .catch(this.handleError);
	// }

	getProcessInstanceGroups(partyId:string, collaborationRole:string, page: number, limit: number): Promise<ProcessInstanceGroupResponse> {
		let offset:number = page * limit;
		const url = `${this.url}/group?partyID=${partyId}&collaborationRole=${collaborationRole}&offset=${offset}&limit=${limit}`;
		return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getProcessInstancesOfGroup(groupId: string): Promise<ProcessInstance[]> {
		const url = `${this.url}/group/${groupId}/process-instance`;
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
