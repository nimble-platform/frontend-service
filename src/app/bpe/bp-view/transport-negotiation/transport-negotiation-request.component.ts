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

import { Component, Input, OnInit} from '@angular/core';
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { CookieService } from "ng2-cookies";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { INCOTERMS, PAYMENT_MEANS, CURRENCIES } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { copy } from "../../../common/utils";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { UserService } from "../../../user-mgmt/user.service";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { BPEService } from "../../bpe.service";
import { ThreadEventMetadata } from '../../../catalogue/model/publish/thread-event-metadata';
import { DiscountPriceWrapper } from "../../../common/discount-price-wrapper";
import { Text } from '../../../catalogue/model/publish/text';
import { TranslateService } from '@ngx-translate/core';
import { DocumentService } from "../document-service";
import {ValidationService} from '../../../common/validation/validators';
import {FormGroup} from '@angular/forms';

@Component({
    selector: "transport-negotiation-request",
    templateUrl: "./transport-negotiation-request.component.html"
})
export class TransportNegotiationRequestComponent implements OnInit {

    rfq: RequestForQuotation;
    selectedTab: string = "OVERVIEW";
    rfqPrice: DiscountPriceWrapper;
    rfqPaymentTerms: PaymentTermsWrapper;
    updatingProcess: boolean = false;

    callStatus: CallStatus = new CallStatus();

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    CURRENCIES: string[] = CURRENCIES;

    deliverytermsOfBuyer = null;
    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;
    // this component is used for both transport and logistics service negotiation
    // however, we need to know the type of service since some tabs are displayed only for transport services
    @Input() isTransportService: boolean;
    // save the default delivery period unit so that we can understand whether the delivery period is updated by the buyer or not
    defaultDeliveryPeriodUnit: string = null;
    // negotiation request form
    negotiationRequestForm: FormGroup = new FormGroup({});

    constructor(private bpDataService: BPDataService,
        private bpeService: BPEService,
        private documentService: DocumentService,
        private cookieService: CookieService,
        private userService: UserService,
        private validationService: ValidationService,
        private location: Location,
        private translate: TranslateService,
        private router: Router) {
    }

    ngOnInit() {
        // Normally, this view is not displayed if the bpDataService.requestForQuotation is null.
        // However, it should also be checked here also for the second and later iterations of the negotiation business process.
        // In those cases, the negotiation component is not initialized again but only this component.
        if (this.bpDataService.requestForQuotation == null) {
            this.bpDataService.initRfqWithQuotation();
        }

        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        this.userService.getSettingsForParty(this.cookieService.get("company_id")).then(res => {
            this.deliverytermsOfBuyer = res.tradeDetails.deliveryTerms;
        });

        this.rfq = this.bpDataService.requestForQuotation;
        // for logistics services except transport services, onyl Negotiation tab is available
        if (!this.isTransportService) {
            this.selectedTab = "NEGOTIATION";
        }
        this.validateRfq();
        this.rfqPrice = new DiscountPriceWrapper(
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.bpDataService.getCatalogueLine().requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        //this.rfqPrice.quotationLinePriceWrapper = new ItemPriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.requestForQuotationLine[0].lineItem.paymentTerms);
        if (this.processMetadata && this.processMetadata.isBeingUpdated) {
            this.updatingProcess = true;
        }
        // set the default delivery period unit
        this.defaultDeliveryPeriodUnit = this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode;
    }

    // be sure that rfq has all necessary fields to start a bp
    validateRfq() {
        // special terms
        if (this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms == null || this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms.length == 0) {
            this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms.push(new Text(""));
        }
    }

    isDisabled(): boolean {
        return this.isWaitingForReply() || this.callStatus.fb_submitted;
    }

    isWaitingForReply(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
    }

    onBack(): void {
        this.location.back();
    }

    // check whether the required fields for transport service details are filled or not
    isTransportServiceDetailsValid() {
        // no need to check transport service details for logistics services which are not transport services
        if (!this.isTransportService) {
            return true;
        }
        return this.negotiationRequestForm.valid;
    }

    onSendRequest(): void {
        // send request for quotation
        this.callStatus.submit();
        let rfq: RequestForQuotation = copy(this.bpDataService.requestForQuotation);

        let sellerId: string;
        let sellerFederationId: string;

        // final check on the rfq
        if (this.bpDataService.modifiedCatalogueLines) {
            sellerId = UBLModelUtils.getPartyId(this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.manufacturerParty);
            sellerFederationId = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.manufacturerParty.federationInstanceID;
        }
        else {
            sellerId = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);
            sellerFederationId = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.federationInstanceID;
        }

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId, sellerFederationId)
        ])
            .then(([buyerParty, sellerParty]) => {
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                return this.bpeService.startProcessWithDocument(rfq, sellerParty.federationInstanceID);
            })
            .then(() => {
                this.callStatus.callback("Terms sent", true);
                let tab = 'PURCHASES';
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], { queryParams: { tab: tab, ins: rfq.sellerSupplierParty.party.federationInstanceID } });
            })
            .catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
    }

    onUpdateRequest(): void {
        this.callStatus.submit();
        let rfq: RequestForQuotation = copy(this.bpDataService.requestForQuotation);
        this.bpeService.updateBusinessProcess(JSON.stringify(rfq), "REQUESTFORQUOTATION", this.processMetadata.processInstanceId, this.processMetadata.sellerFederationId)
            .then(() => {
                this.documentService.updateCachedDocument(rfq.id, rfq);
                this.callStatus.callback("Terms updated", true);
                let tab = 'PURCHASES';
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], { queryParams: { tab: tab } });
            })
            .catch(error => {
                this.callStatus.error("Failed to update Terms", error);
            });
    }

    isTermUpdated(term: string): boolean {
        switch (term) {
            case "price":
                return (this.rfqPrice.itemPrice.value != null && this.rfqPrice.itemPrice.value != 0) || this.rfqPrice.itemPrice.currency != this.CURRENCIES[0];
            case "payment-means":
                return this.PAYMENT_MEANS[0] != this.rfq.requestForQuotationLine[0].lineItem.paymentMeans.paymentMeansCode.value;
            case "payment-terms":
                return this.rfqPaymentTerms.getDefaultPaymentTerms() != this.rfqPaymentTerms.paymentTerm;
            case "incoterms":
                return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms != null && this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms != "";
            case "special-terms":
                return this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms[0].value != null && this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms[0].value != "";
            case "delivery-period":
                return this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode != this.defaultDeliveryPeriodUnit || this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value != null;
            case "pick-up":
                return this.rfq.delivery.requestedDeliveryPeriod.startDate != null && this.rfq.delivery.requestedDeliveryPeriod.startDate != "";
            case "drop-off":
                return this.rfq.delivery.requestedDeliveryPeriod.endDate != null && this.rfq.delivery.requestedDeliveryPeriod.endDate != "";
            case "notes":
                return UBLModelUtils.areNotesOrFilesAttachedToDocument(this.rfq);
            default:
                return true;
        }
    }

    getValidationError(): string {
        return this.validationService.extractErrorMessage(this.negotiationRequestForm);
    }
}
