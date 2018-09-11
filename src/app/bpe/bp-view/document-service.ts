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

@Injectable()
export class DocumentService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.bpe_endpoint;
    private mapOfDocument = new Map();
    constructor(private http: Http) { }

    getCachedDocument(documentID:string): Promise<any> {
        if (this.mapOfDocument.has(documentID)){
            return Promise.resolve(this.mapOfDocument.get(documentID));
        }
        else {
            return this.getDocumentJsonContent(documentID).then(document => {
                this.mapOfDocument.set(documentID,document);
                return document;
            })
        }
    }

    updateCachedDocument(documentID:string,document:any){
        this.mapOfDocument.set(documentID,document);
    }

    getDocumentJsonContent(documentId:string):Promise<any> {
        const url = `${this.url}/document/json/${documentId}`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getItemInformationRequest(itemInformationResponse: ItemInformationResponse): Promise<ItemInformationRequest> {
        return this.getDocumentJsonContent(itemInformationResponse.itemInformationRequestDocumentReference.id);
    }

    getRequestForQuotation(quotation: Quotation): Promise<RequestForQuotation> {
        return this.getDocumentJsonContent(quotation.requestForQuotationDocumentReference.id);
    }

    getInitialDocument(processVariables: any[]): any {
        let id = null;
        for (let variable of processVariables) {
            if (variable.name == "initialDocumentID") {
                id = variable.value;
            }
        }
        if (id){
            return this.getCachedDocument(id);
        }
        else {
            return null;
        }
    }

    getResponseDocument(processVariables: any[]): any {
        let id = null;
        for (let variable of processVariables) {
            if (variable.name == "responseDocumentID") {
                id = variable.value;
            }
        }
        if (id){
            return this.getCachedDocument(id);
        }
        else {
            return null;
        }
    }

    getUserRole(activityVariables: any,partyId:any): Promise<BpUserRole> {
        return this.getInitialDocument(activityVariables).then(initialDoc => {
            let processType = ActivityVariableParser.getProcessType(activityVariables);
            let buyerId:any = ActivityVariableParser.getBuyerId(initialDoc,processType);
            let role:BpUserRole = buyerId == partyId ? 'buyer' : 'seller';
            return Promise.resolve(role);
        });
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}

