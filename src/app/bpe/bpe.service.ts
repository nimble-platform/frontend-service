import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {ProcessInstanceInputMessage} from "./model/process-instance-input-message";
import {ProcessInstance} from "./model/process-instance";
import {ProcessInstanceGroup} from "./model/process-instance-group";
import {BPDataService} from "./bp-view/bp-data-service";
import {ProcessInstanceGroupResponse} from "./model/process-instance-group-response";
import {ProcessInstanceGroupFilter} from "./model/process-instance-group-filter";
import {CookieService} from "ng2-cookies";
import {Contract} from "../catalogue/model/publish/contract";

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.bpe_endpoint;

	constructor(private http: Http,
				private bpDataService:BPDataService,
				private cookieService: CookieService) { }

	startBusinessProcess(piim:ProcessInstanceInputMessage):Promise<ProcessInstance> {
		let url = `${this.url}/start`;
		if(this.bpDataService.getRelatedGroupId() != null) {
			url += '?gid=' + this.bpDataService.getRelatedGroupId();
		}
		if(this.bpDataService.precedingProcessId != null) {
			if(this.bpDataService.getRelatedGroupId() != null) {
				url += '&';
			} else {
				url += '?';
			}
			url += 'precedingPid=' + this.bpDataService.precedingProcessId;
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
		let url = `${this.url}/continue`;
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

	getProcessInstanceGroupFilters(partyId:string, collaborationRole:string, archived: boolean, products: string[], categories: string[], partners: string[]): Promise<ProcessInstanceGroupFilter> {
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		let headers = new Headers({'Accept': 'application/json','Authorization': token});
		this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));

		let url:string = `${this.url}/group/filters?partyID=${partyId}&collaborationRole=${collaborationRole}&archived=${archived}`;
		if(products.length > 0) {
			url += '&relatedProducts=' + this.stringtifyArray(products);
		}
		if(categories.length > 0) {
			url += '&relatedProductCategories=' + this.stringtifyArray(categories);
		}
		if(partners.length > 0) {
			url += '&tradingPartnerIDs=' + this.stringtifyArray(partners);
		}
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getProcessInstanceGroups(partyId:string, collaborationRole:string, page: number, limit: number, archived: boolean, products: string[], categories: string[], partners: string[]): Promise<ProcessInstanceGroupResponse> {
		let offset:number = page * limit;
		let url:string = `${this.url}/group?partyID=${partyId}&collaborationRole=${collaborationRole}&offset=${offset}&limit=${limit}&archived=${archived}`;
		if(products.length > 0) {
			url += '&relatedProducts=' + this.stringtifyArray(products);
		}
		if(categories.length > 0) {
			url += '&relatedProductCategories=' + this.stringtifyArray(categories);
		}
		if(partners.length > 0) {
			url += '&tradingPartnerIDs=' + this.stringtifyArray(partners);
		}
		return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	deleteProcessInstanceGroup(groupId: string) {
		const url = `${this.url}/group/${groupId}`;
		return this.http
            .delete(url)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	archiveProcessInstanceGroup(groupId: string) {
		const url = `${this.url}/group/${groupId}/archive`;
		return this.http
            .post(url, null)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	restoreProcessInstanceGroup(groupId: string) {
		const url = `${this.url}/group/${groupId}/restore`;
		return this.http
            .post(url, null)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	constructContractForProcess(processInstancesId: string): Promise<Contract> {
		const url = `${this.url}/contracts?processInstanceId=${processInstancesId}`;
		return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}
	private stringtifyArray(values: any[]): string {
		let paramVal: string = '';
		for (let value of values) {
			paramVal += value + ',';
		}
		paramVal = paramVal.substring(0, paramVal.length-1);
		return paramVal;
	}

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}
}
