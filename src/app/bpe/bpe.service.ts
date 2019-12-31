import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import {ProcessInstance} from "./model/process-instance";
import {BPDataService} from "./bp-view/bp-data-service";
import {CollaborationGroupResponse} from "./model/process-instance-group-response";
import {ProcessInstanceGroupFilter} from "./model/process-instance-group-filter";
import {CookieService} from "ng2-cookies";
import {Contract} from "../catalogue/model/publish/contract";
import {Clause} from "../catalogue/model/publish/clause";
import { CollaborationRole } from "./model/collaboration-role";
import { Order } from '../catalogue/model/publish/order';
import { EvidenceSupplied } from '../catalogue/model/publish/evidence-supplied';
import { Comment } from '../catalogue/model/publish/comment';
import {DashboardProcessInstanceDetails} from './model/dashboard-process-instance-details';
import {DigitalAgreement} from "../catalogue/model/publish/digital-agreement";
import {CollaborationGroup} from "./model/collaboration-group";
import {DocumentReference} from '../catalogue/model/publish/document-reference';
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {FEDERATION, FEDERATIONID} from '../catalogue/model/constants';
import {FederatedCollaborationGroupMetadata} from './model/federated-collaboration-group-metadata';

@Injectable()
export class BPEService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.bpe_endpoint;
	private delegate_url = myGlobals.delegate_endpoint;

	private delegated = (FEDERATION() == "ON");

	constructor(private http: Http,
				private bpDataService:BPDataService,
				private cookieService: CookieService) { }

    startProcessWithDocument(document:any,delegateId:string):Promise<ProcessInstance> {
        const headers = this.getAuthorizedHeaders();
        let url = `${this.url}/process-document`;
        if(this.delegated){
			url = `${this.delegate_url}/process-document?delegateId=${delegateId}`;
		}

        // create a DocumentReference for the previous document
        if(this.bpDataService.precedingDocumentId){
            let documentRef:DocumentReference = new DocumentReference();
            documentRef.id = this.bpDataService.precedingDocumentId;
            documentRef.documentType = "previousDocument";
            document.additionalDocumentReference.push(documentRef);
        }
        // create a DocumentReference for the previous order
        if(this.bpDataService.precedingOrderId){
            let documentRef:DocumentReference = new DocumentReference();
            documentRef.id = this.bpDataService.precedingOrderId;
            documentRef.documentType = "previousOrder";

            document.additionalDocumentReference.push(documentRef);
        }

		// create DocumentReferences for the unshipped orders
		if(this.bpDataService.unShippedOrderIds){
			for(let unShippedOrderId of this.bpDataService.unShippedOrderIds){
				let documentRef:DocumentReference = new DocumentReference();
				documentRef.id = unShippedOrderId;
				documentRef.documentType = "unShippedOrder";

				document.additionalDocumentReference.push(documentRef);
			}
		}

		UBLModelUtils.removeHjidFieldsFromObject(document);
        return this.http
            .post(url, JSON.stringify(document), {headers: headers})
            .toPromise()
            .then(res => {
				if (myGlobals.debug)
					console.log(res.json());
				return res.json();
			})
            .catch(this.handleError);
	}

	cancelBusinessProcess(id: string,delegateId:string): Promise<any> {
	    let headers = this.getAuthorizedHeaders();
		let url = `${this.url}/processInstance/${id}/cancel`;
		if(this.delegated){
			url = `${this.delegate_url}/processInstance/${id}/cancel?delegateId=${delegateId}`;
		}
		return this.http
		.post(url, null, {headers: headers})
		.toPromise()
		.then(res => res.text())
		.catch(this.handleError);
	}

    cancelCollaboration(groupId: string,delegateId:string): Promise<any> {
        let headers = this.getAuthorizedHeaders();
        let url = `${this.url}/process-instance-groups/${groupId}/cancel`;
        if(this.delegated){
			url = `${this.delegate_url}/process-instance-groups/${groupId}/cancel?delegateId=${delegateId}`;
		}
        return this.http
            .post(url, null, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
    }

    finishCollaboration(groupId: string,delegateId:string): Promise<any> {
        let headers = this.getAuthorizedHeaders();
        let url = `${this.url}/process-instance-groups/${groupId}/finish`;
        if(this.delegated){
			url = `${this.delegate_url}/process-instance-groups/${groupId}/finish?delegateId=${delegateId}`;
		}
        return this.http
            .post(url, null, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
    }

    updateBusinessProcess(content: string, processID: string, processInstanceID: string,delegateId:string): Promise<any> {
        let url = `${this.url}/processInstance?processID=${processID}&processInstanceID=${processInstanceID}&creatorUserID=${this.cookieService.get("user_id")}`;
        if(this.delegated){
			url = `${this.delegate_url}/processInstance?processID=${processID}&processInstanceID=${processInstanceID}&creatorUserID=${this.cookieService.get("user_id")}&delegateId=${delegateId}`;
		}
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
		let url = `${this.url}/statistics/total-number/business-process/action-required?archived=false&role=buyer&partyId=${partyId}`;
		if(this.delegated){
			url = `${this.delegate_url}/statistics/total-number/business-process/action-required?archived=false&role=buyer&partyId=${partyId}`;
		}
		let headers = this.getAuthorizedHeaders();
		headers.append("federationId",FEDERATIONID());
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
	}

	getActionRequiredSeller(partyId: string): Promise<any> {
		let url = `${this.url}/statistics/total-number/business-process/action-required?archived=false&role=seller&partyId=${partyId}`;
		if(this.delegated){
			url = `${this.delegate_url}/statistics/total-number/business-process/action-required?archived=false&role=seller&partyId=${partyId}`;
		}
		let headers = this.getAuthorizedHeaders();
		headers.append("federationId",FEDERATIONID());
		return this.http
            .get(url, {headers: headers})
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

	getFulfilmentStatistics(orderId: string,delegateId:string): Promise<any> {
		let url = `${this.url}/statistics/fulfilment?orderId=${orderId}`;
		if(this.delegated){
			url = `${this.delegate_url}/statistics/fulfilment?orderId=${orderId}&delegateId=${delegateId}`;
		}
		return this.http
			.get(url, {headers: this.getAuthorizedHeaders()})
			.toPromise()
			.then(res => res.json())
			.catch(this.handleError);
	}

	getProcessInstanceGroupFilters(partyId:string, collaborationRole: CollaborationRole, archived: boolean, products: string[],
		categories: string[], partners: string[],status: string[],isProject:boolean): Promise<ProcessInstanceGroupFilter> {
		let headers = this.getAuthorizedHeaders();

		let url: string = `${this.url}/process-instance-groups/filters?partyId=${partyId}&collaborationRole=${collaborationRole}&archived=${archived}`;
		if(this.delegated){
			url = `${this.delegate_url}/process-instance-groups/filters?partyId=${partyId}&collaborationRole=${collaborationRole}&archived=${archived}`;
		}
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
		if(isProject){
		    url += '&isProject='+isProject;
		}

		headers.append("federationId",FEDERATIONID())

		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getCollaborationGroups(partyId:string, collaborationRole: CollaborationRole, page: number, limit: number, archived: boolean, products: string[], categories: string[], partners: string[], status: string[], isProject?:boolean): Promise<CollaborationGroupResponse> {
		let offset:number = page * limit;
		let url:string = `${this.url}/collaboration-groups?partyId=${partyId}&collaborationRole=${collaborationRole}&offset=${offset}&limit=${limit}&archived=${archived}`;
		if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups?partyId=${partyId}&collaborationRole=${collaborationRole}&offset=${offset}&limit=${limit}&archived=${archived}`;
		}
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

		if(isProject){
		    url += '&isProject='+isProject;
		}

		let headers = this.getAuthorizedHeaders();
		headers.append("federationId",FEDERATIONID())

		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getGroupDetailsForProcessInstance(processInstanceId: string,delegateId:string): Promise<CollaborationGroup> {
		let url:string = `${this.url}/processInstance/${processInstanceId}/collaboration-group`;
		if(this.delegated){
			url = `${this.delegate_url}/processInstance/${processInstanceId}/collaboration-group?delegateId=${delegateId}`;
		}
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	paymentDone(orderId: string,delegateId:string): Promise<any> {
		let headers = this.getAuthorizedHeaders();
		let url = `${this.url}/paymentDone/${orderId}?delegateId=${delegateId}`;
		if(this.delegated){
			url = `${this.delegate_url}/paymentDone/${orderId}?delegateId=${delegateId}`;
		}
		return this.http
			.post(url, null, {headers: headers})
			.toPromise()
			.then(res => res.text())
			.catch(this.handleError);
	}

	isPaymentDone(orderId: string,delegateId:string): Promise<any> {
		let headers = this.getAuthorizedHeaders();
		let url = `${this.url}/paymentDone/${orderId}?delegateId=${delegateId}`;
		if(this.delegated){
			url = `${this.delegate_url}/paymentDone/${orderId}?delegateId=${delegateId}`;
		}
		return this.http
			.get(url,  {headers: headers})
			.toPromise()
			.then(res => res.text())
			.catch(this.handleError);
	}

	getDashboardProcessInstanceDetails(processInstanceId:string,delegateId:string): Promise<DashboardProcessInstanceDetails>{
        let url:string = `${this.url}/processInstance/${processInstanceId}/details?delegateId=${delegateId}`;
        if(this.delegated){
			url = `${this.delegate_url}/processInstance/${processInstanceId}/details?delegateId=${delegateId}`;
		}
        return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	updateCollaborationGroupName(groupId:string,delegateId:string,groupName:string){
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        let url = `${this.url}/collaboration-groups/${groupId}?groupName=${groupName}`;
        if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups/${groupId}?groupName=${groupName}&delegateId=${delegateId}`;
		}
        return this.http
            .patch(url,null,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    deleteCollaborationGroup(groupId: string,delegateId:string) {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
		let url = `${this.url}/collaboration-groups/${groupId}`;
		if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups/${groupId}?delegateId=${delegateId}`;
		}
        return this.http
            .delete(url,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

	archiveCollaborationGroup(groupId: string,delegateId:string){
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        let url = `${this.url}/collaboration-groups/${groupId}/archive`;
        if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups/${groupId}/archive?delegateId=${delegateId}`;
		}
        return this.http
            .post(url, null,{headers:new Headers({"Authorization":token})})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

    restoreCollaborationGroup(groupId: string,delegateId:string) {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
	    let url = `${this.url}/collaboration-groups/${groupId}/restore`;
		if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups/${groupId}/restore?delegateId=${delegateId}`;
		}
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

	downloadContractBundle(id: string,delegateId:string): Promise<any> {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
		let url = `${this.url}/contracts/create-bundle?orderId=${id}`;
		if(this.delegated){
			url = `${this.delegate_url}/contracts/create-bundle?orderId=${id}&delegateId=${delegateId}`;
		}
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

	getTermsAndConditions(buyerPartyId, sellerPartyId, incoterms:string, tradingTerm:string): Promise<Clause[]>{
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Authorization': token});
		this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));

		let url = `${this.url}/contracts/terms-and-conditions?sellerPartyId=${sellerPartyId}&incoterms=${incoterms == null ? "" :incoterms}`;
        // add parameters
        if(buyerPartyId){
            url += `&buyerPartyId=${buyerPartyId}`;
		}
        if(tradingTerm){
			url += `&tradingTerm=${tradingTerm}`;
		}

		return this.http
			.get(url, {headers: headers})
			.toPromise()
			.then(res => res.json())
			.catch(this.handleError);
	}

	getOriginalOrderForProcess(processId: string,delegateId:string): Promise<Order | null> {
		const headers = this.getAuthorizedHeaders();
		let url = `${this.url}/process-instance-groups/order-document?processInstanceId=${processId}`;
		if(this.delegated){
			url = `${this.delegate_url}/process-instance-groups/order-document?processInstanceId=${processId}&delegateId=${delegateId}`;
		}
		return this.http
            .get(url, { headers })
            .toPromise()
            .then(res => res.json() || null)
            .catch(() => null);
	}

	getRatingsSummary(partyId: string): Promise<any> {
		const headers = this.getAuthorizedHeaders();
		const url = `${this.url}/ratingsSummary?partyId=${partyId}`;
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(res => {
                if (res.status == 400) {
                    // no ratings
                    return null;
                } else {
                    this.handleError(res.getBody());
                }
            });
    }

	postRatings(partyId: string, partyFederationId:string, processInstanceId: string, ratings: EvidenceSupplied[], reviews: Comment[],delegateId:string): Promise<any> {
		let headers = this.getAuthorizedHeaders();
		let url = `${this.url}/ratingsAndReviews?partyId=${partyId}&processInstanceID=${processInstanceId}&ratings=${encodeURIComponent(JSON.stringify(ratings))}&reviews=${encodeURIComponent(JSON.stringify(reviews))}`;
		if(this.delegated){
			url = `${this.delegate_url}/ratingsAndReviews?partyId=${partyId}&processInstanceID=${processInstanceId}&ratings=${encodeURIComponent(JSON.stringify(ratings))}&reviews=${encodeURIComponent(JSON.stringify(reviews))}&delegateId=${delegateId}`;
		}
		headers.append("federationId",partyFederationId)
		return this.http
            .post(url, null, {headers: headers})
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
	}

	ratingExists(processInstanceId: string, partyId: string, federationId:string,delegateId:string): Promise<any> {
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Accept': 'text/plain','Authorization': token,"federationId":federationId});
		let url: string = `${this.url}/processInstance/${processInstanceId}/isRated?partyId=${partyId}`;
		if(this.delegated){
			url = `${this.delegate_url}/processInstance/${processInstanceId}/isRated?partyId=${partyId}&delegateId=${delegateId}`;
		}
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
	}

	getProcessInstanceIdForDocument(documentId: string): Promise<any> {
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Accept': 'text/plain','Authorization': token});
		let url: string = `${this.url}/processInstance/document/${documentId}`;
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.text())
            .catch(this.handleError);
	}

	getFrameContract(sellerId: string, buyerId: string, productIds: string[],initiatorFederationId:string,responderFederationId:string): Promise<DigitalAgreement> {
		let productIdsParam = "";
		let size = productIds.length;
		for (let i = 0; i < size; i++) {
			productIdsParam += productIds[i];

			if (i != size - 1) {
				productIdsParam += ",";
			}
		}
		let url = `${this.url}/contract/digital-agreement?sellerId=${sellerId}&buyerId=${buyerId}&productIds=${productIds}`;
		if(this.delegated){
			url = `${this.delegate_url}/contract/digital-agreement?sellerId=${sellerId}&buyerId=${buyerId}&productIds=${productIds}&delegateId=${responderFederationId}`;
		}
		let headers = this.getAuthorizedHeaders();
		headers.append("initiatorFederationId",initiatorFederationId);
		headers.append("responderFederationId",responderFederationId);
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getFrameContractByHjid(hjid: number,delegateId:string): Promise<DigitalAgreement> {
		let url = `${this.url}/contract/digital-agreement/${hjid}`;
		if(this.delegated){
			url = `${this.delegate_url}/contract/digital-agreement/${hjid}?delegateId=${delegateId}`;
		}
		return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	getAllFrameContractsForParty(partyId: string): Promise<DigitalAgreement[]> {
		let url = `${this.url}/contract/digital-agreement/all?partyId=${partyId}`;
		if(this.delegated){
			url = `${this.delegate_url}/contract/digital-agreement/all?partyId=${partyId}`;
		}
		let headers = this.getAuthorizedHeaders();
		headers.append("federationId",FEDERATIONID());
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	deleteFrameContract(hjid: number,delegateId:string): Promise<DigitalAgreement[]> {
		let url = `${this.url}/contract/digital-agreement/${hjid}`;
		if(this.delegated){
			url = `${this.delegate_url}/contract/digital-agreement/${hjid}?delegateId=${delegateId}`;
		}
		return this.http
			.delete(url, {headers: this.getAuthorizedHeaders()})
			.toPromise()
			.then(res => res.text())
			.catch(this.handleError);
	}

	checkAllCollaborationsFinished(partyId:string,federationId:string){
        let url = `${this.url}/collaboration-groups/all-finished?partyId=${partyId}`;
        if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups/all-finished?partyId=${partyId}`;
		}
        let headers = this.getAuthorizedHeaders();
        headers.append("federationId",federationId);
        return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

    checkCollaborationFinished(groupId:string,delegateId:string):Promise<any>{
        let url = `${this.url}/process-instance-groups/${groupId}/finished`;
        if(this.delegated){
			url = `${this.delegate_url}/process-instance-groups/${groupId}/finished?delegateId=${delegateId}`;
		}
        return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

	mergeNegotations(baseId:string , collaborationGroupMetadata:FederatedCollaborationGroupMetadata[], delegateId:string) {
		let url = `${this.url}/collaboration-groups/merge?bcid=${baseId}`;
		if(this.delegated){
			url = `${this.delegate_url}/collaboration-groups/merge?bcid=${baseId}&delegateId=${delegateId}`;
		}
		return this.http
            .post(url, collaborationGroupMetadata, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}
	exportTransactions(partyId: string, userId: string, direction: string, archived: boolean): Promise<any> {
		let url = `${this.url}/processInstance/export?partyId=${partyId}`;
		if(this.delegated){
			url = `${this.delegate_url}/processInstance/export?partyId=${partyId}`;
		}
		if(userId != null) {
			url += `&userId=${userId}`;
		}
		if(direction != null) {
			url += `&direction=${direction}`;
		}
		if(archived != null) {
			url += `&archived=${archived}`;
		}

		return new Promise<any>((resolve, reject) => {
			const token = 'Bearer '+this.cookieService.get("bearer_token");
			let xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.setRequestHeader('Accept', 'application/zip');
			xhr.setRequestHeader('Accept', 'text/plain');
			xhr.setRequestHeader('Authorization', token);
			xhr.setRequestHeader("federationId",FEDERATIONID());
			xhr.responseType = 'blob';

			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {

						var contentType = 'application/zip';
						var blob = new Blob([xhr.response], {type: contentType});
						// file name
						let fileName = 'transactions_' + new Date().toString();

						resolve({fileName: fileName, content: blob});
					} else {
						reject(xhr.responseText);
					}


				} else if(xhr.readyState == 2) {
					if(xhr.status == 200) {
						xhr.responseType = "blob";
					} else {
						xhr.responseType = "text";
					}
				}
			};
			xhr.send();
		});
	}

	public getExpectedOrders(partyId: string): Promise<string[]> {
		const url = `${this.url}/documents/expected-orders?partyId=${partyId}`;
		let headers = this.getAuthorizedHeaders()
		headers.append("federationId",FEDERATIONID())
		return this.http
            .get(url, {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
	}

	private getAuthorizedHeaders(): Headers {
		const token = 'Bearer '+this.cookieService.get("bearer_token");
		const headers = new Headers({'Accept': 'application/json','Authorization': token});
		this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
		return headers;
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
		if(error.status == 404) {
			// ignore
			return null;
		} else {
			return Promise.reject(error.message || error);
		}
	}
}
