import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { Location } from "@angular/common";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { Router } from "@angular/router";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { NegotiationModelWrapper } from "./negotiation-model-wrapper";
import { NEGOTIATION_RESPONSES, CURRENCIES } from "../../../catalogue/model/constants";
import { ModelUtils } from "../../model/model-utils";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { CallStatus } from "../../../common/call-status";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { BpUserRole } from "../../model/bp-user-role";
import {CookieService} from 'ng2-cookies';
import {DiscountModalComponent} from '../../../product-details/discount-modal.component';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';
import * as myGlobals from '../../../globals';
import {isValidPrice} from "../../../common/utils";

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {

    line: CatalogueLine;
    @Input() rfq: RequestForQuotation;
    @Input() quotation: Quotation;
    wrapper: NegotiationModelWrapper;
    userRole: BpUserRole;
    @Input() readonly: boolean = false;
    config = myGlobals.config;

    CURRENCIES: string[] = CURRENCIES;

    callStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    getPartyId = UBLModelUtils.getPartyId;
    showTermsAndConditions:boolean = false;
    showPurchaseOrder:boolean = false;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.line = this.bpDataService.getCatalogueLine();
        if(this.rfq == null) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        if(this.quotation == null) {
            this.quotation = this.bpDataService.quotation;
        }
        this.bpDataService.computeRfqNegotiationOptionsIfNeededWithRfq(this.rfq);

        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, this.quotation,
            this.bpDataService.getCompanySettings().negotiationSettings);

        // we set removeDiscountAmount to false so that total price of rfq will not be changed
        this.wrapper.rfqPriceWrapper.removeDiscountAmount = false;
        // we set quotationPriceWrapper's presentationMode to be sure that the total price of quotation response will not be changed
        this.wrapper.quotationPriceWrapper.presentationMode = this.getPresentationMode();

        this.userRole = this.bpDataService.bpStartEvent.userRole;
    }

    onBack(): void {
        this.location.back();
    }

    onRespondToQuotation(accepted: boolean) {
        if (!isValidPrice(this.wrapper.quotationPriceWrapper.totalPrice)) {
            alert("Price cannot have more than 2 decimal places");
            return false;
        }
        if(accepted) {
            if(this.hasUpdatedTerms()) {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.TERMS_UPDATED;
            } else {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.ACCEPTED;
            }
        } else {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.REJECTED;
        }

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.sellerSupplierParty.party),this.cookieService.get("user_id"), this.quotation, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Quotation sent", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to send quotation", error);
            });
    }

    onRequestNewQuotation() {
        this.bpDataService.initRfqWithQuotation();
        this.bpDataService.proceedNextBpStep("buyer", "Negotiation");
    }

    onAcceptAndOrder() {
        this.bpDataService.initOrderWithQuotation();
        this.bpDataService.proceedNextBpStep("buyer", "Order");
    }

    /*
     * Getters and Setters
     */

    isLoading(): boolean {
        return false;
    }

    isDisabled(): boolean {
        return this.isLoading() || this.readonly;
    }

    getPresentationMode(): "edit" | "view" {
        return this.isReadOnly() ? "view" : "edit";
    }

    isReadOnly(): boolean {
        return this.processMetadata == null || this.processMetadata.processStatus !== 'Started' || this.readonly;
    }

    get quotationPrice(): number {
        return this.wrapper.quotationPriceWrapper.totalPrice;
    }

    set quotationPrice(price: number) {
        this.wrapper.quotationPriceWrapper.totalPrice = price;
    }

    /*
     * Internal Methods
     */

    hasUpdatedTerms(): boolean {
        if(this.rfq.negotiationOptions.deliveryPeriod) {
            const rfq = this.wrapper.rfqDeliveryPeriod;
            const quotation = this.wrapper.quotationDeliveryPeriod;
            if(!this.qtyEquals(rfq, quotation)) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.incoterms) {
            if(this.wrapper.rfqIncoterms !== this.wrapper.quotationIncoterms) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.paymentMeans) {
            if(this.wrapper.rfqPaymentMeans !== this.wrapper.quotationPaymentMeans) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.paymentTerms) {
            if(this.wrapper.rfqPaymentTerms !== this.wrapper.quotationPaymentTerms) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.price) {
            if(this.wrapper.rfqPriceWrapper.totalPriceString !== this.wrapper.quotationPriceWrapper.totalPriceString) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.warranty) {
            const rfq = this.wrapper.rfqWarranty;
            const quotation = this.wrapper.quotationWarranty;
            if(!this.qtyEquals(rfq, quotation)) {
                return true;
            }
        }
        return false;
    }

    private qtyEquals(qty1: Quantity, qty2: Quantity): boolean {
        return qty1.value === qty2.value && qty1.unitCode === qty2.unitCode;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.quotationPriceWrapper.appliedDiscounts,this.wrapper.quotationPriceWrapper.price.priceAmount.currencyID);
    }
}
