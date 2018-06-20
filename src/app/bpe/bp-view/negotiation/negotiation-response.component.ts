import { Component, OnInit } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { Router } from "@angular/router";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { NegotiationModelWrapper } from "./negotiation-model-wrapper";
import { Address } from "../../../catalogue/model/publish/address";
import { INCOTERMS, PAYMENT_TERMS, PAYMENT_MEANS, NEGOTIATION_RESPONSES } from "../../../catalogue/model/constants";
import { ModelUtils } from "../../model/model-utils";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { CallStatus } from "../../../common/call-status";
import { Quantity } from "../../../catalogue/model/publish/quantity";

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {


    line: CatalogueLine;
    rfq: RequestForQuotation;
    quotation: Quotation;
    wrapper: NegotiationModelWrapper;

    // needed because the price is an Amount, which has a value: string.
    private quotationPriceValue: number;

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = PAYMENT_TERMS;

    callStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private router: Router) {

    }

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();
        this.rfq = this.bpDataService.requestForQuotation;
        this.quotation = this.bpDataService.quotation;
        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, this.quotation);


        // temp stuff to test


        this.rfq.negotiationOptions.price = true
        this.rfq.requestForQuotationLine[0].lineItem.price.priceAmount.value = 3000000;
        this.rfq.requestForQuotationLine[0].lineItem.price.priceAmount.currencyID = "EUR";
        this.quotation.quotationLine[0].lineItem.price.priceAmount.value = 3000000;
        this.quotation.quotationLine[0].lineItem.price.priceAmount.currencyID = "EUR";


        this.rfq.negotiationOptions.deliveryPeriod = true
        this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value = 7;
        this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode = "working days";
        this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value = 7;
        this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode = "working days";


        this.rfq.negotiationOptions.warranty = false
        this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure.value = 100
        this.rfq.requestForQuotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure.unitCode = "weeks"
        this.quotation.quotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure.value = 100
        this.quotation.quotationLine[0].lineItem.warrantyValidityPeriod.durationMeasure.unitCode = "weeks"


        this.rfq.negotiationOptions.incoterms = true
        this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms = "CFR (Cost and Freight)"
        this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms = "CFR (Cost and Freight)"


        this.rfq.negotiationOptions.paymentMeans = false
        this.rfq.paymentMeans = "Credit Card"
        this.quotation.paymentMeans = "Credit Card"


        this.rfq.negotiationOptions.paymentTerms = false
        this.rfq.paymentTerms = "PIA (Payment in advance)"
        this.quotation.paymentTerms = "PIA (Payment in advance)"

        this.rfq.delivery.deliveryAddress = new Address("Vienna", "1200", "10", "Vorgartenstrasse", {
            name: "Austria"
        });

        // TODO this should be before the temp stuff.
        this.quotationPriceValue = Number(this.wrapper.quotationPriceAmount.value || "0");

        // bpDataService.userRole == "seller" || "buyer"
    }

    respondToQuotation(accepted: boolean) {

        if(accepted) {
            if(this.hasUpdatedTerms()) {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.TERMS_UPDATED;
            } else {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.ACCEPTED;
            }
        } else {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.REJECTED;
        }

        let vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.bpDataService.requestForQuotation.buyerCustomerParty.party.id,
            this.bpDataService.requestForQuotation.sellerSupplierParty.party.id, this.quotation, this.bpDataService);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(
                res => {
                    this.callStatus.callback("Quotation sent", true);
                    this.router.navigate(['dashboard']);
                }
            )
            .catch(error => {
                    this.callStatus.error("Failed to send quotation");
                    console.log("Error while sending response", error);
                }
            );
    }

    isLoading(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return this.bpDataService.processMetadata == null || this.bpDataService.processMetadata.processStatus !== 'Started';
    }

    /*
     * Getters and Setters
     */

    get quotationPrice(): number {
        return this.quotationPriceValue;
    }

    set quotationPrice(price: number) {
        this.quotationPriceValue = price;
        this.wrapper.quotationPriceAmount.value = price;
    }

    /*
     * Internal Methods
     */

    private hasUpdatedTerms(): boolean {
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
            if(this.wrapper.rfqPriceAmount.value !== this.wrapper.quotationPriceAmount.value) {
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

}
