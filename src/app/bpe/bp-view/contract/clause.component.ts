import {Component, Input, OnInit} from "@angular/core";
import {Clause} from "../../../catalogue/model/publish/clause";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { DocumentClause } from "../../../catalogue/model/publish/document-clause";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import {DocumentService} from "../document-service";
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';
import {BPDataService} from '../bp-data-service';
import {copy} from '../../../common/utils';
import {CatalogueLine} from '../../../catalogue/model/publish/catalogue-line';

@Component({
    selector: 'clause',
    templateUrl: './clause.component.html'
})
export class ClauseComponent implements OnInit {
    @Input() clause: Clause = null;
    // whether the items are deleted or not
    @Input() areCatalogueLinesDeleted:boolean[];
    @Input() selectedLine:CatalogueLine;
    clauseDocument = null;
    itemInformationRequest: ItemInformationRequest;
    rfq: RequestForQuotation;
    clauseDocumentRetrievalStatus: CallStatus = new CallStatus();

    expanded: boolean = false;

    // default T&C for negotiation
    defaultTermsAndConditions:Clause[] = null;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
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
                            // if the seller company has T&Cs, then use them
                            if(this.bpDataService.getCompanySettings().negotiationSettings.company.salesTerms && this.bpDataService.getCompanySettings().negotiationSettings.company.salesTerms.termOrCondition.length > 0){
                                this.defaultTermsAndConditions = copy(this.bpDataService.getCompanySettings().negotiationSettings.company.salesTerms.termOrCondition);
                                this.clauseDocumentRetrievalStatus.callback("Successfully retrieved request for quotation", true);
                            }
                            // otherwise, use the default T&Cs
                            else {
                                this.bpeService.getTermsAndConditions(
                                    null,
                                    UBLModelUtils.getPartyId(this.rfq.buyerCustomerParty.party),
                                    UBLModelUtils.getPartyId(this.rfq.sellerSupplierParty.party),
                                    null,
                                    this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms,
                                    this.bpDataService.getCompanySettings().negotiationSettings.paymentTerms[0]
                                ).then(defaultTermsAndConditions => {
                                    this.defaultTermsAndConditions = defaultTermsAndConditions;
                                    this.clauseDocumentRetrievalStatus.callback("Successfully retrieved request for quotation", true);
                                }).catch(error => {
                                    this.clauseDocumentRetrievalStatus.error("Failed to retrieve default T&C", error);
                                });
                            }
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
