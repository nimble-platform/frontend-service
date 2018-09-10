import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from "../../globals"
import {RequestForQuotation} from "../../catalogue/model/publish/request-for-quotation";
import {Quotation} from "../../catalogue/model/publish/quotation";
import {ItemInformationResponse} from "../../catalogue/model/publish/item-information-response";
import {ItemInformationRequest} from "../../catalogue/model/publish/item-information-request";

@Injectable()
export class DocumentService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.bpe_endpoint;

    constructor(private http: Http) { }


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

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}

