/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, Input, OnInit } from '@angular/core';
import { Order } from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";
import { BPDataService } from "../bp-data-service";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import { Location } from "@angular/common";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { Router } from "@angular/router";
import { copy, quantityToString } from "../../../common/utils";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { UserService } from "../../../user-mgmt/user.service";
import { CookieService } from "ng2-cookies";
import { BPEService } from "../../bpe.service";
import { BpUserRole } from "../../model/bp-user-role";
import { OrderResponseSimple } from "../../../catalogue/model/publish/order-response-simple";
import { PriceWrapper } from "../../../common/price-wrapper";
import { Party } from "../../../catalogue/model/publish/party";
import { DocumentClause } from "../../../catalogue/model/publish/document-clause";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { Address } from "../../../catalogue/model/publish/address";
import { SearchContextService } from "../../../simple-search/search-context.service";
import { EpcService } from "../epc-service";
import { DocumentService } from "../document-service";
import { ThreadEventMetadata } from '../../../catalogue/model/publish/thread-event-metadata';
import * as myGlobals from '../../../globals';
import { Contract } from '../../../catalogue/model/publish/contract';
import { Clause } from '../../../catalogue/model/publish/clause';
import { TranslateService } from '@ngx-translate/core';
import { CatalogueLine } from '../../../catalogue/model/publish/catalogue-line';
import { Delivery } from '../../../catalogue/model/publish/delivery';
import {Quantity} from '../../../catalogue/model/publish/quantity';

@Component({
    selector: "order-item",
    templateUrl: "./order-item.component.html",
    styleUrls: ["./order-item.component.css"]
})
export class OrderItemComponent implements OnInit {

    @Input() selectedLineIndex: number;
    @Input() lineIndex: number;
    order: Order;
    address: Address
    orderResponse: OrderResponseSimple;
    lastQuotation: Quotation;
    paymentTermsWrapper: PaymentTermsWrapper;
    @Input() priceWrapper: PriceWrapper;
    userRole: BpUserRole;
    config = myGlobals.config;

    @Input() buyerParty: Party;
    @Input() sellerParty: Party;

    dataMonitoringDemanded: boolean;

    initCallStatus: CallStatus = new CallStatus();
    submitCallStatus: CallStatus = new CallStatus();
    fetchDataMonitoringStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    getPartyId = UBLModelUtils.getPartyId;
    getCompanyTermsAndConditionFiles = UBLModelUtils.getCompanyTermsAndConditionFiles

    selectedPanel: string;
    selectedTCTab: 'CUSTOM_TERMS' | 'CLAUSES' = 'CUSTOM_TERMS';

    // map representing the workflow of seller's company
    companyWorkflowMap = null;
    // whether multiple delivery dates are specified instead of a delivery period in the order
    areDeliveryDatesAvailable: boolean = false;
    // contract consisting of the details of previous steps such as PPAP and Negotiation
    orderContract: Contract = null;

    constructor(public bpDataService: BPDataService,
        private userService: UserService,
        private bpeService: BPEService,
        private cookieService: CookieService,
        private searchContextService: SearchContextService,
        private epcService: EpcService,
        private location: Location,
        private router: Router,
        private translate: TranslateService,
        private documentService: DocumentService) {
    }

    ngOnInit(): void {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        this.order = this.bpDataService.order;
        this.address = this.order.orderLine[this.lineIndex].lineItem.deliveryTerms.deliveryLocation.address;
        this.paymentTermsWrapper = new PaymentTermsWrapper(this.order.orderLine[this.lineIndex].lineItem.paymentTerms);
        this.userRole = this.bpDataService.bpActivityEvent.userRole;
        this.orderResponse = this.bpDataService.orderResponse;
        this.orderContract = this.getOrderContract();

        this.companyWorkflowMap = this.bpDataService.getCompanyWorkflowMap(null);

        this.initCallStatus.submit();

        if (UBLModelUtils.areDeliveryDatesAvailable(this.getDelivery())) {
            this.areDeliveryDatesAvailable = true;
        }

        // null check is for checking whether a new order is initialized
        // preceding process id check is for checking whether there is any preceding process before the order
        if (this.getNonTermAndConditionContract() == null && this.bpDataService.precedingProcessId != null) {
            Promise.all([
                this.isDataMonitoringDemanded()
            ])
                .then(([dataMonitoringDemanded]) => {
                    this.dataMonitoringDemanded = dataMonitoringDemanded;
                    this.initCallStatus.callback("Initialized", true);

                }).catch(error => {
                    this.initCallStatus.error("Error while initializing", error);
                });

        } else {
            Promise.all([
                this.isDataMonitoringDemanded(),
            ]).then(([dataMonitoringDemanded]) => {
                this.dataMonitoringDemanded = dataMonitoringDemanded;
                this.initCallStatus.callback("Initialized", true);
            })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing", error);
                });
        }
    }

    // retrieve the order contract which is not the Term and Condition contract
    getNonTermAndConditionContract() {
        if (this.order.contract) {
            for (let contract of this.order.contract) {
                for (let clause of contract.clause) {
                    if (clause.type) {
                        return contract;
                    }
                }
            }
        }
        return null;
    }

    getTermAndConditionClauses(): Clause[] {
        if (this.order.contract) {
            for (let contract of this.order.contract) {
                for (let clause of contract.clause) {
                    if (!clause.type) {
                        return contract.clause;
                    }
                }
            }
        }
        return null;
    }

    /*
     * Event Handlers
     */

    onTCTabSelect(event: any, id: any): void {
        event.preventDefault();
        this.selectedTCTab = id;
    }

    /*
     * Getters & Setters
     */

    isSeller(): boolean {
        return this.userRole === "seller";
    }

    isReady(): boolean {
        return !this.initCallStatus.isDisplayed() && !!this.order;
    }

    isLoading(): boolean {
        return this.submitCallStatus.fb_submitted;
    }

    isOrderCompleted(): boolean {
        return this.processMetadata && this.processMetadata.processStatus === "Completed";
    }

    isReadOnly(): boolean {
        if (this.userRole === "buyer") {
            return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
        }
        return this.isOrderCompleted();
    }

    getQuantity(): Quantity{
        return this.priceWrapper.orderedQuantity;
    }

    getDeliveryPeriod():Quantity{
        return this.getLineItem().delivery[0].requestedDeliveryPeriod.durationMeasure;
    }

    isDeliveryPeriodSpecified(): boolean {
        return this.getLineItem().delivery[0].requestedDeliveryPeriod.durationMeasure.value != null;
    }

    getDelivery(): Delivery[] {
        return this.getLineItem().delivery;
    }

    getWarrantyPeriod(): Quantity {
        return this.getLineItem().warrantyValidityPeriod.durationMeasure;
    }

    getIncoterm(): string {
        return this.getLineItem().deliveryTerms.incoterms;
    }

    getPaymentMeans(): string {
        return this.order.orderLine[this.lineIndex].lineItem.paymentMeans.paymentMeansCode.value;
    }

    getLineItem(): LineItem {
        return this.order.orderLine[this.lineIndex].lineItem;
    }

    /*
     *
     */

    private isDataMonitoringDemanded(): Promise<boolean> {
        let quotationClause: DocumentClause = null;

        let contract = this.getNonTermAndConditionContract();

        if (contract && contract.clause.length > 0) {
            // contract contains the clauses such the latest ones would be in the initial indices
            for (let clause of contract.clause) {
                let clauseCopy = JSON.parse(JSON.stringify(clause));
                if (clauseCopy.clauseDocumentRef) {
                    let documentClause = clause as DocumentClause;
                    if (documentClause.clauseDocumentRef.documentType === "QUOTATION") {
                        quotationClause = documentClause;
                        break;
                    }
                }
            }
        }

        if (quotationClause) {
            this.fetchDataMonitoringStatus.submit();
            return this.documentService.getCachedDocument(quotationClause.clauseDocumentRef.id, this.sellerParty.federationInstanceID).then(result => {
                this.fetchDataMonitoringStatus.callback("Successfully fetched data monitoring service", true);
                this.lastQuotation = result as Quotation;
                return this.lastQuotation.quotationLine[this.lineIndex].lineItem.dataMonitoringRequested;
            })
                .catch(error => {
                    this.fetchDataMonitoringStatus.error("Error while fetching data monitoring service", error);
                    throw error;
                })
        }

        return Promise.resolve(false);
    }

    populateAreCatalogueLinesDeletedArray(): boolean[] {
        let areCatalogueLinesDeleted: boolean[] = [];
        if (this.processMetadata) {
            for (let isProductDeleted of this.processMetadata.areProductsDeleted) {
                if (isProductDeleted) {
                    areCatalogueLinesDeleted.push(true);
                }
                else {
                    areCatalogueLinesDeleted.push(false);
                }
            }
        }
        else {
            areCatalogueLinesDeleted.push(false);
        }

        return areCatalogueLinesDeleted;
    }

    private getOrderContract(): Contract {
        let orderContract = null;
        if (this.order.contract) {
            for (let contract of this.order.contract) {
                for (let clause of contract.clause) {
                    if (clause.type) {
                        orderContract = contract;
                        break;
                    }
                }
            }
        }
        return orderContract;
    }
}
