/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, Input, OnInit } from "@angular/core";
import { Clause } from "../../../catalogue/model/publish/clause";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { CallStatus } from "../../../common/call-status";
import { BPEService } from "../../bpe.service";
import { DocumentClause } from "../../../catalogue/model/publish/document-clause";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { DocumentService } from "../document-service";
import { UBLModelUtils } from '../../../catalogue/model/ubl-model-utils';
import { BPDataService } from '../bp-data-service';
import { copy } from '../../../common/utils';
import {ContractService} from '../contract-service';
import {Ppap} from '../../../catalogue/model/publish/ppap';

@Component({
    selector: 'clause',
    templateUrl: './clause.component.html'
})
export class ClauseComponent implements OnInit {
    @Input() clause: Clause = null;
    @Input() sellerFederationId: string = null;
    // whether the items are deleted or not
    @Input() areCatalogueLinesDeleted: boolean[];
    @Input() selectedLineIndex: number;
    clauseDocument = null;
    itemInformationRequest: ItemInformationRequest;
    rfq: RequestForQuotation;
    clauseDocumentRetrievalStatus: CallStatus = new CallStatus();

    expanded: boolean = false;

    // default T&C for negotiation
    defaultTermsAndConditions: any = null;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private contractService: ContractService,
                private documentService: DocumentService) {
    }

    ngOnInit(): void {
        if (this.clauseDocument == null) {
            this.clauseDocumentRetrievalStatus.submit();
            let documentClause: DocumentClause = this.clause as DocumentClause;
            this.documentService.getCachedDocument(documentClause.clauseDocumentRef.id, this.sellerFederationId).then(result => {
                this.clauseDocument = result;
                if (documentClause.clauseDocumentRef.documentType === "ITEMINFORMATIONRESPONSE") {
                    // fetch the itm information request as well
                    this.documentService.getItemInformationRequest(result)
                        .then(request => {
                            this.itemInformationRequest = request;
                            this.clauseDocumentRetrievalStatus.callback("Successfully retrieved item information request", true);
                        })
                        .catch(error => {
                            this.clauseDocumentRetrievalStatus.error("Failed to retrieve item information request", error);
                        })
                } else if (documentClause.clauseDocumentRef.documentType === "QUOTATION") {
                    // fetch the itm information request as well
                    this.documentService.getRequestForQuotation(result)
                        .then(request => {
                            this.rfq = request;
                            // retrieve default terms and conditions
                            this.contractService.getDefaultTermsAndConditions(this.rfq.requestForQuotationLine.map(value => value.lineItem.item.catalogueDocumentReference.id),
                                this.rfq.requestForQuotationLine.map(value => value.lineItem.deliveryTerms.incoterms),
                                UBLModelUtils.getPartyId(this.rfq.buyerCustomerParty.party),
                                this.rfq.buyerCustomerParty.party.federationInstanceID,
                                Array(this.rfq.requestForQuotationLine.length).fill(this.bpDataService.getCompanySettings())).then((defaultTermsAndConditions) => {
                                this.defaultTermsAndConditions = defaultTermsAndConditions;
                                this.clauseDocumentRetrievalStatus.callback("Successfully retrieved request for quotation", true);
                            }).catch(error => {
                                this.clauseDocumentRetrievalStatus.error("Failed to retrieve default T&C", error);
                            });
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
        if (this.clause instanceof DocumentClause) {
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
