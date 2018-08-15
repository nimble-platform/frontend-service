import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { PriceWrapper } from "../../../common/price-wrapper";
import { INCOTERMS, PAYMENT_MEANS, CURRENCIES, NEGOTIATION_RESPONSES } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BpUserRole } from "../../model/bp-user-role";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { BPEService } from "../../bpe.service";

@Component({
    selector: "transport-negotiation-response",
    templateUrl: "./transport-negotiation-response.component.html",
    styleUrls: ["./transport-negotiation-response.component.css"]
})
export class TransportNegotiationResponseComponent implements OnInit {

    rfq: RequestForQuotation;
    rfqPrice: PriceWrapper;
    rfqPaymentTerms: PaymentTermsWrapper;

    quotation: Quotation;
    quotationPrice: PriceWrapper;
    quotationPaymentTerms: PaymentTermsWrapper;
    
    selectedTab: string = "OVERVIEW";
    userRole: BpUserRole;

    callStatus: CallStatus = new CallStatus();

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    CURRENCIES: string[] = CURRENCIES;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router) {

    }

    ngOnInit() {
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqPrice = new PriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.paymentTerms);

        this.quotation = this.bpDataService.quotation;
        this.quotationPrice = new PriceWrapper(this.quotation.quotationLine[0].lineItem.price);
        this.quotationPaymentTerms = new PaymentTermsWrapper(this.quotation.paymentTerms);

        this.userRole = this.bpDataService.userRole;
    }

    isDisabled(): boolean {
        return this.isResponseSent() || this.isLoading();
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    isResponseSent(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return this.bpDataService.processMetadata == null || this.bpDataService.processMetadata.processStatus !== 'Started';
    }

    onBack(): void {
        this.location.back();
    }

    onRespondToQuotation(accepted: boolean): void {
        if(accepted) {
            if(this.hasUpdatedTerms()) {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.TERMS_UPDATED;
            } else {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.ACCEPTED;
            }
        } else {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.REJECTED;
        }

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.bpDataService.requestForQuotation.buyerCustomerParty.party.id,
            this.bpDataService.requestForQuotation.sellerSupplierParty.party.id, this.quotation, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(
                res => {
                    this.callStatus.callback("Quotation sent", true);
                    this.router.navigate(['dashboard']);
                }
            )
            .catch(error => {
                    this.callStatus.error("Failed to send quotation", error);
                }
            );
    }

    onRequestNewQuotation() {
        this.bpDataService.initRfqWithQuotation();
        this.bpDataService.setBpOptionParameters("buyer", "Negotiation", "Negotiation");
    }

    onAcceptAndOrder() {
        this.bpDataService.initOrderWithQuotation();
        this.bpDataService.setBpOptionParameters("buyer", "Order", "Negotiation");
    }

    private hasUpdatedTerms(): boolean {
        // TODO

        // if(this.rfq.negotiationOptions.deliveryPeriod) {
        //     const rfq = this.wrapper.rfqDeliveryPeriod;
        //     const quotation = this.wrapper.quotationDeliveryPeriod;
        //     if(!this.qtyEquals(rfq, quotation)) {
        //         return true;
        //     }
        // }
        // if(this.rfq.negotiationOptions.incoterms) {
        //     if(this.wrapper.rfqIncoterms !== this.wrapper.quotationIncoterms) {
        //         return true;
        //     }
        // }
        // if(this.rfq.negotiationOptions.paymentMeans) {
        //     if(this.wrapper.rfqPaymentMeans !== this.wrapper.quotationPaymentMeans) {
        //         return true;
        //     }
        // }
        // if(this.rfq.negotiationOptions.paymentTerms) {
        //     if(this.wrapper.rfqPaymentTerms !== this.wrapper.quotationPaymentTerms) {
        //         return true;
        //     }
        // }
        // if(this.rfq.negotiationOptions.price) {
        //     if(this.wrapper.rfqPriceWrapper.totalPriceString !== this.wrapper.quotationPriceWrapper.totalPriceString) {
        //         return true;
        //     }
        // }
        // if(this.rfq.negotiationOptions.warranty) {
        //     const rfq = this.wrapper.rfqWarranty;
        //     const quotation = this.wrapper.quotationWarranty;
        //     if(!this.qtyEquals(rfq, quotation)) {
        //         return true;
        //     }
        // }
        
        return false;
    }

}
