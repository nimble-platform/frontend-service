import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {ProcessInstanceInputMessage} from "./model/process-instance-input-message";
import {ProcessInstance} from "./model/process-instance";
import {BPDataService} from "./bp-view/bp-data-service";
import {CollaborationGroupResponse} from "./model/process-instance-group-response";
import {ProcessInstanceGroupFilter} from "./model/process-instance-group-filter";
import {CookieService} from "ng2-cookies";
import {Contract} from "../catalogue/model/publish/contract";
import {Clause} from "../catalogue/model/publish/clause";
import { CollaborationRole } from "./model/collaboration-role";
import { ItemInformationResponse } from '../catalogue/model/publish/item-information-response';
import { ItemInformationRequest } from '../catalogue/model/publish/item-information-request';
import { Order } from '../catalogue/model/publish/order';
import { TradingTerm } from '../catalogue/model/publish/trading-term';
import { Quotation } from '../catalogue/model/publish/quotation';
import { RequestForQuotation } from '../catalogue/model/publish/request-for-quotation';
import { EvidenceSupplied } from '../catalogue/model/publish/evidence-supplied';
import { Comment } from '../catalogue/model/publish/comment';
import {SearchContextService} from '../simple-search/search-context.service';
import {DashboardProcessInstanceDetails} from './model/dashboard-process-instance-details';

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.bpe_endpoint;

	constructor(private http: Http,
				private bpDataService:BPDataService,
                private searchContextService: SearchContextService,
				private cookieService: CookieService) { }

	startBusinessProcess(piim:ProcessInstanceInputMessage):Promise<ProcessInstance> {
		const headers = this.getAuthorizedHeaders();
		let url = `${this.url}/start`;
		if(this.bpDataService.bpStartEvent.containerGroupId != null) {
			url += '?gid=' + this.bpDataService.bpStartEvent.containerGroupId;
		}
		if(this.bpDataService.precedingProcessId != null) {
			if(this.bpDataService.bpStartEvent.containerGroupId != null) {
				url += '&';
			} else {
				url += '?';
			}
			url += 'precedingPid=' + this.bpDataService.precedingProcessId;
		}
		if(this.bpDataService.bpStartEvent.collaborationGroupId != null){
			if(this.bpDataService.bpStartEvent.containerGroupId != null || this.bpDataService.precedingProcessId != null){
			    url += '&';
            }
            else {
			    url += "?";
            }
            url += 'collaborationGID=' + this.bpDataService.bpStartEvent.collaborationGroupId
		}

		if(this.searchContextService.getPrecedingGroupId() != null){
			if(this.bpDataService.bpStartEvent.containerGroupId != null || this.bpDataService.precedingProcessId != null || this.bpDataService.bpStartEvent.collaborationGroupId != null){
				url += '&';
			}
			else {
				url += '?';
			}
			url += 'precedingGid=' + this.searchContextService.getPrecedingGroupId();

			// if we have a precedingGroupId,then we need also a precedingProcessId
			if(this.bpDataService.precedingProcessId == null){
                url += '&precedingPid=' + this.searchContextService.getAssociatedProcessMetadata().processId;
            }
		}
		return this.http
            .post(url, JSON.stringify(piim), {headers: headers})
            .toPromise()
            .then(res => {
				if (myGlobals.debug)
					console.log(res.json());
            	return res.json();
            })
            .catch(this.handleError);
	}

	continueBusinessProcess(piim:ProcessInstanceInputMessage):Promise<ProcessInstance> {
		const headers = this.getAuthorizedHeaders();
		let url = `${this.url}/continue`;
		if(this.bpDataService.bpStartEvent.containerGroupId != null) {
			url += '?gid=' + this.bpDataService.bpStartEvent.containerGroupId;
		}
		if(this.bpDataService.bpStartEvent.collaborationGroupId != null){
			if(this.bpDataService.bpStartEvent.containerGroupId != null){
				url += '&collaborationGID=' + this.bpDataService.bpStartEvent.collaborationGroupId;
			}
			else {
				url += '?collaborationGID=' + this.bpDataService.bpStartEvent.collaborationGroupId;
			}
		}

		return this.http
            .post(url, JSON.stringify(piim), {headers: headers})
            .toPromise()
            .then(res => {
				if (myGlobals.debug)
					console.log(res.json());
				return res.json();
			})
            .catch(this.handleError);
	}

	cancelBusinessProcess(id: string): Promise<any> {
	    let headers = this.getAuthorizedHeaders();
		const url = `${this.url}/processInstance/${id}/cancel`;
		return this.http
		.post(url, null, {headers: headers})
		.toPromise()
		.then(res => res.text())
		.catch(this.handleError);
	}

    cancelCollaboration(groupId: string): Promise<any> {
        let headers = this.getAuthorizedHeaders();
        const url = `${this.url}/process-instance-groups/${groupId}/cancel`;
        return this.http
            .post(url, null, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
    }

	updateBusinessProcess(content: string, processID: string, processInstanceID: string): Promise<any> {
        const url = `${this.url}/processInstance?processID=${processID}&processInstanceID=${processInstanceID}&creatorUserID=${this.cookieService.get("user_id")}`;
        return this.http
            .patch(url, content,{headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
	}

	getProcessInstanceGroup(groupId: string){
		let url:string = `${this.url}/process-instance-groups/${groupId}`;
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
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

	getActionRequiredCounter(companyId: string): Promise<any> {
			return Promise.all([
					this.getActionRequiredBuyer(companyId),
					this.getActionRequiredSeller(companyId)
			]).then(([buyer, seller]) => {
					return {"buyer":buyer,"seller":seller};
			})
	}

	getActionRequiredBuyer(partyId: string): Promise<any> {
		const url = `${this.url}/statistics/total-number/business-process/action-required?archived=false&role=buyer&partyId=${partyId}`;
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
	}

	getActionRequiredSeller(partyId: string): Promise<any> {
		const url = `${this.url}/statistics/total-number/business-process/action-required?archived=false&role=seller&partyId=${partyId}`;
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.text())
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

	getProcessInstanceGroupFilters(partyId:string, collaborationRole: CollaborationRole, archived: boolean, products: string[],
		categories: string[], partners: string[],status: string[]): Promise<ProcessInstanceGroupFilter> {
		const headers = this.getAuthorizedHeaders();

		let url: string = `${this.url}/process-instance-groups/filters?partyId=${partyId}&collaborationRole=${collaborationRole}&archived=${archived}`;
		if(products.length > 0) {
			url += '&relatedProducts=' + this.stringifyArray(products);
		}
		if(categories.length > 0) {
			url += '&relatedProductCategories=' + this.stringifyArray(categories);
		}
		if(partners.length > 0) {
			url += '&tradingPartnerIDs=' + this.stringifyArray(partners);
		}
		if(status.length > 0){
			url += '&status='+this.stringifyArray(status);
		}
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getCollaborationGroups(partyId:string, collaborationRole: CollaborationRole, page: number, limit: number, archived: boolean, products: string[], categories: string[], partners: string[], status: string[]): Promise<CollaborationGroupResponse> {
		let offset:number = page * limit;
		let url:string = `${this.url}/collaboration-groups?partyId=${partyId}&collaborationRole=${collaborationRole}&offset=${offset}&limit=${limit}&archived=${archived}`;
		if(products.length > 0) {
			url += '&relatedProducts=' + this.stringifyArray(products);
		}
		if(categories.length > 0) {
			url += '&relatedProductCategories=' + this.stringifyArray(categories);
		}
		if(partners.length > 0) {
			url += '&tradingPartnerIDs=' + this.stringifyArray(partners);
		}
		if(status.length > 0){
		    url += '&status='+this.stringifyArray(status);
        }
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getDashboardProcessInstanceDetails(processInstanceId:string): Promise<DashboardProcessInstanceDetails>{
        let url:string = `${this.url}/processInstance/${processInstanceId}/details`;
        return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	deleteProcessInstanceGroup(groupId: string) {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
		const url = `${this.url}/process-instance-groups/${groupId}`;
		return this.http
            .delete(url,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	updateCollaborationGroupName(groupId:string,groupName:string){
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const url = `${this.url}/collaboration-groups/${groupId}?groupName=${groupName}`;
        return this.http
            .patch(url,null,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deleteCollaborationGroup(groupId: string) {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const url = `${this.url}/collaboration-groups/${groupId}`;
        return this.http
            .delete(url,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

	archiveCollaborationGroup(groupId: string){
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const url = `${this.url}/collaboration-groups/${groupId}/archive`;
        return this.http
            .post(url, null,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

    restoreCollaborationGroup(groupId: string) {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
	    const url = `${this.url}/collaboration-groups/${groupId}/restore`;
        return this.http
            .post(url, null,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
}

	constructContractForProcess(processInstancesId: string): Promise<Contract> {
		const url = `${this.url}/contracts?processInstanceId=${processInstancesId}`;
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	downloadContractBundle(id: string): Promise<any> {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
		const url = `${this.url}/contracts/create-bundle?orderId=${id}`;
        return new Promise<any>((resolve, reject) => {
            let xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);
            xhr.setRequestHeader('Accept', 'application/zip');
            xhr.setRequestHeader("Authorization",token);
            xhr.responseType = 'blob';

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        var contentType = 'application/zip';
                        var blob = new Blob([xhr.response], {type: contentType});
                        resolve({fileName: "Contract Bundle.zip", content: blob});
                    } else {
                        reject(xhr.status);
                    }
                }
            }
            xhr.send();
        });
    }

	getTermsAndConditions(orderId: string,buyerPartyId, sellerPartyId, rfqId:string, incoterms:string, tradingTerms:TradingTerm[]): Promise<Clause[]>{
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Authorization': token});
		this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));

		let url;
		if(orderId){
			url = `${this.url}/contracts/terms-and-conditions?orderId=${orderId}&sellerPartyId=${sellerPartyId}&buyerPartyId=${buyerPartyId}&incoterms=${incoterms == null ? "" :incoterms}&tradingTerms=${encodeURIComponent(JSON.stringify(this.getSelectedTradingTerms(tradingTerms)))}`;
		}
		else if(rfqId){
			url = `${this.url}/contracts/terms-and-conditions?rfqId=${rfqId}&sellerPartyId=${sellerPartyId}&buyerPartyId=${buyerPartyId}&incoterms=${incoterms == null ? "" :incoterms}&tradingTerms=${encodeURIComponent(JSON.stringify(this.getSelectedTradingTerms(tradingTerms)))}`;
		}
		else{
            url = `${this.url}/contracts/terms-and-conditions?sellerPartyId=${sellerPartyId}&buyerPartyId=${buyerPartyId}&incoterms=${incoterms == null ? "" :incoterms}&tradingTerms=${encodeURIComponent(JSON.stringify(this.getSelectedTradingTerms(tradingTerms)))}`;

        }
		return this.http
			.get(url, {headers: headers})
			.toPromise()
			.then(res => res.json())
			.catch(this.handleError);
	}

	getOriginalOrderForProcess(processId: string): Promise<Order | null> {
		const headers = this.getAuthorizedHeaders();
		const url = `${this.url}/process-instance-groups/order-document?processInstanceId=${processId}`;
		return this.http
            .get(url, { headers })
            .toPromise()
            .then(res => res.json() || null)
            .catch(() => null);
	}

	getRatings(partyId: string): Promise<any> {
		const headers = this.getAuthorizedHeaders();
		const url = `${this.url}/ratingsAndReviews?partyId=${partyId}`;
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getRatingsSummary(partyId: string): Promise<any> {
		const headers = this.getAuthorizedHeaders();
		const url = `${this.url}/ratingsSummary?partyId=${partyId}`;
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	postRatings(partyId: string, processInstanceId: string, ratings: EvidenceSupplied[], reviews: Comment[]): Promise<any> {
		const headers = this.getAuthorizedHeaders();
		const url = `${this.url}/ratingsAndReviews?partyId=${partyId}&processInstanceID=${processInstanceId}&ratings=${encodeURIComponent(JSON.stringify(ratings))}&reviews=${encodeURIComponent(JSON.stringify(reviews))}`;
		return this.http
            .post(url, null, {headers: headers})
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
	}

	ratingExists(processInstanceId: string, partyId: string): Promise<any> {
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Accept': 'text/plain','Authorization': token});
		let url: string = `${this.url}/processInstance/${processInstanceId}/isRated?partyId=${partyId}`;
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
	}

	private getAuthorizedHeaders(): Headers {
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Accept': 'application/json','Authorization': token});
		this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
		return headers;
	}

	private  getSelectedTradingTerms(tradingTerms): TradingTerm[] {
        let selectedTradingTerms: TradingTerm[] = [];

        for(let tradingTerm of tradingTerms){
            if(tradingTerm.id.indexOf("Values") != -1){
                let addToList = true;
                for(let value of tradingTerm.value){
                    if(value == null){
                        addToList = false;
                        break;
                    }
                }
                if(addToList){
                    selectedTradingTerms.push(tradingTerm);
                }
            }
            else{
                if(tradingTerm.value[0] == 'true'){
                    selectedTradingTerms.push(tradingTerm);
                }
            }
        }
        return selectedTradingTerms;
	}

	private stringifyArray(values: any[]): string {
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
