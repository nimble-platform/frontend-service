import {Component, Input, OnInit} from "@angular/core";
import {Clause} from "../../../catalogue/model/publish/clause";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { DocumentClause } from "../../../catalogue/model/publish/document-clause";
import { ItemInformationResponse } from "../../../catalogue/model/publish/item-information-response";

@Component({
    selector: 'clause',
    templateUrl: './clause.component.html'
})
export class ClauseComponent implements OnInit {
    @Input() clause: Clause = null;

    clauseDocument = null;
    itemInformationRequest: ItemInformationRequest;
    clauseDocumentRetrievalStatus: CallStatus = new CallStatus();

    expanded: boolean = false;

    constructor(private bpeService: BPEService) {
    }

    ngOnInit(): void {
        if (this.clauseDocument == null) {
            this.clauseDocumentRetrievalStatus.submit();
            let documentClause: DocumentClause = this.clause as DocumentClause;
            this.bpeService.getDocumentJsonContent(documentClause.clauseDocumentRef.id).then(result => {
                this.clauseDocument = result;
                if(this.clause.type === "ITEM_DETAILS") {
                    // fetch the itm information request as well
                    this.bpeService.getItemInformationRequest(result)
                    .then(request => {
                        this.itemInformationRequest = request;
                        this.clauseDocumentRetrievalStatus.callback("Successfully retrieved item information request", true);
                    })
                    .catch(error => {
                        this.clauseDocumentRetrievalStatus.error("Failed to retrieve item information request", error);
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
        switch(this.clause.type) {
            case "PPAP":
                return "Ppap";
            case "ITEM_DETAILS":
                return "Request for Informations";
            default:
                return this.clause.type;
        }
    }

}
