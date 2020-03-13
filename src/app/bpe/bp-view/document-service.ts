import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from "../../globals"
import {RequestForQuotation} from "../../catalogue/model/publish/request-for-quotation";
import {Quotation} from "../../catalogue/model/publish/quotation";
import {ItemInformationResponse} from "../../catalogue/model/publish/item-information-response";
import {ItemInformationRequest} from "../../catalogue/model/publish/item-information-request";
import {BpUserRole} from "../model/bp-user-role";
import {ActivityVariableParser} from "./activity-variable-parser";
import {CookieService} from 'ng2-cookies';
import {copy} from "../../common/utils";
import {FEDERATION} from '../../catalogue/model/constants';

@Injectable()
export class DocumentService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.bpe_endpoint;
    private mapOfDocument = new Map();

    private delegate_url = myGlobals.delegate_endpoint;

    private delegated = (FEDERATION() == "ON");

    constructor(private http: Http,
                private cookieService: CookieService) { }

    getCachedDocument(documentID:string,delegateId:string): Promise<any> {
        if (this.mapOfDocument.has(documentID)){
            return Promise.resolve(copy(this.mapOfDocument.get(documentID)));
        }
        else {
            return this.getDocumentJsonContent(documentID,delegateId).then(document => {
                this.mapOfDocument.set(documentID,document);
                return copy(document);
            })
        }
    }

    updateCachedDocument(documentID:string,document:any){
        this.mapOfDocument.set(documentID,document);
    }

    private getDocumentJsonContent(documentId:string,delegateId:string):Promise<any> {
        let url = `${this.url}/document/json/${documentId}`;
        if(this.delegated){
            url = `${this.delegate_url}/document/json/${documentId}?delegateId=${delegateId}`;
        }
        return this.http
            .get(url, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    updateDocument(documentId: string, documentType: string, document: any,delegateId:string): Promise<any> {
        let url = `${this.url}/document/${documentId}?documentType=${documentType}`;
        if(this.delegated){
            url = `${this.delegate_url}/document/${documentId}?documentType=${documentType}&delegateId=${delegateId}`;
        }
        return this.http
            .patch(url, document, {headers: this.getAuthorizedHeaders()})
            .toPromise()
            .then(res => {
                let resJson = res.json();
                this.updateCachedDocument(documentId, resJson);
                return resJson;
            })
            .catch(this.handleError);
    }

    getItemInformationRequest(itemInformationResponse: ItemInformationResponse): Promise<ItemInformationRequest> {
        return this.getCachedDocument(itemInformationResponse.itemInformationRequestDocumentReference.id,itemInformationResponse.sellerSupplierParty.party.federationInstanceID);
    }

    getRequestForQuotation(quotation: Quotation): Promise<RequestForQuotation> {
        return this.getCachedDocument(quotation.requestForQuotationDocumentReference.id,quotation.sellerSupplierParty.party.federationInstanceID);
    }

    getInitialDocument(processVariables: any[],delegateId:string): any {
        let id = null;
        for (let variable of processVariables) {
            if (variable.name == "initialDocumentID") {
                id = variable.value;
            }
        }
        if (id){
            return this.getCachedDocument(id,delegateId);
        }
        else {
            return null;
        }
    }

    getResponseDocument(processVariables: any[],delegateId:string): any {
        let id = null;
        for (let variable of processVariables) {
            if (variable.name == "responseDocumentID") {
                id = variable.value;
            }
        }
        if (id){
            return this.getCachedDocument(id,delegateId);
        }
        else {
            return null;
        }
    }

    private getAuthorizedHeaders(): Headers {
        const token = 'Bearer '+this.cookieService.get("bearer_token");
        const headers = new Headers({'Authorization': token});
        this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
        return headers;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}

