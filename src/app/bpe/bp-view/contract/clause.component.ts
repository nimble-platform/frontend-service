import {Component, Input, OnInit} from "@angular/core";
import {Clause} from "../../../catalogue/model/publish/clause";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { DocumentClause } from "../../../catalogue/model/publish/document-clause";
import { ItemInformationResponse } from "../../../catalogue/model/publish/item-information-response";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import {DocumentService} from "../document-service";

@Component({
    selector: 'clause',
    templateUrl: './clause.component.html'
})
export class ClauseComponent implements OnInit {
    @Input() clause: Clause = null;

    clauseDocument = null;
    itemInformationRequest: ItemInformationRequest;
    rfq: RequestForQuotation;
    clauseDocumentRetrievalStatus: CallStatus = new CallStatus();

    expanded: boolean = false;

    constructor(private bpeService: BPEService,
                private documentService: DocumentService) {
    }

    ngOnInit(): void {
        if (this.clauseDocument == null) {
            this.clauseDocumentRetrievalStatus.submit();
            let documentClause: DocumentClause = this.clause as DocumentClause;
            this.documentService.getDocumentJsonContent(documentClause.clauseDocumentRef.id).then(result => {
                this.clauseDocument = result;
                if(documentClause.clauseDocumentRef.documentType === "ITEMINFORMATIONRESPONSE") {
                    // fetch the itm information request as well
                    this.documentService.getItemInformationRequest(result)
                        .then(request => {
                            this.itemInformationRequest = request;
                            this.clauseDocumentRetrievalStatus.callback("Successfully retrieved item information request", true);
                        })
                        .catch(error => {
                            this.clauseDocumentRetrievalStatus.error("Failed to retrieve item information request", error);
                        })
                } else if(documentClause.clauseDocumentRef.documentType === "QUOTATION") {
                    // fetch the itm information request as well
                    this.documentService.getRequestForQuotation(result)
                        .then(request => {
                            this.rfq = request;
                            this.clauseDocumentRetrievalStatus.callback("Successfully retrieved request for quotation", true);
                        })
                        .catch(error => {
                            this.clauseDocumentRetrievalStatus.error("Failed to retrieve request for quotation", error);
                        })
                } else {
                    this.clauseDocumentRetrievalStatus.callback("Successfully retrieved clause document details", true);
                }
            }).catch(error => {
                this.clauseDocumentRetrievalStatus.error("Failed to retrieve clause document details", error);
            });
        }
    }

    toggleExpanded(): void {
        this.expanded = !this.expanded;
    }

    getClauseName(): string {
        if(this.clause instanceof DocumentClause) {
            switch (this.clause.clauseDocumentRef.documentType) {
                case "PPAPRESPONSE":
                    return "Ppap";
                case "ITEMINFORMATIONRESPONSE":
                    return "Request for Information";
                case "QUOTATION":
                    return "Negotiation";
                default:
                    return this.clause.clauseDocumentRef.documentType;
            }
        }
    }

}
