import { Component, OnInit } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { Router } from "@angular/router";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { NegotiationModelWrapper } from "./negotiation-model-wrapper";
import { INCOTERMS, PAYMENT_MEANS, NEGOTIATION_RESPONSES } from "../../../catalogue/model/constants";
import { ModelUtils } from "../../model/model-utils";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { CallStatus } from "../../../common/call-status";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { BpUserRole } from "../../model/bp-user-role";
import { Location } from "@angular/common";

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
    userRole: BpUserRole;

    // needed because the price is an Amount, which has a value: string.
    private quotationPriceValue: number;

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;

    callStatus: CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router) {

    }

    ngOnInit() {
        this.line = this.bpDataService.getCatalogueLine();
        this.rfq = this.bpDataService.requestForQuotation;
        this.bpDataService.computeRfqNegotiationOptionsIfNeeded();
        this.quotation = this.bpDataService.quotation;
        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, this.quotation);
        this.quotationPriceValue = Number(this.wrapper.quotationPriceAmount.value || "0");
        this.userRole = this.bpDataService.userRole;
    }

    onBack(): void {
        this.location.back();
    }

    onRespondToQuotation(accepted: boolean) {

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

    onRequestNewQuotation() {
        // TODO
    }

    onAcceptAndOrder() {
        // TODO
    }

    /*
     * Getters and Setters
     */

    isLoading(): boolean {
        return false;
    }

    isReadOnly(): boolean {
        return this.bpDataService.processMetadata == null || this.bpDataService.processMetadata.processStatus !== 'Started';
    }

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
