import { Component, OnInit, Input } from "@angular/core";
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

    CURRENCIES: string[] = CURRENCIES;

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
        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, this.quotation, this.bpDataService.getCompanyNegotiationSettings());
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

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.bpDataService.requestForQuotation.buyerCustomerParty.party.id,
            this.bpDataService.requestForQuotation.sellerSupplierParty.party.id, this.quotation, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Quotation sent", true);
                this.router.navigate(['dashboard']);
            })
            .catch(error => {
                this.callStatus.error("Failed to send quotation", error);
            });
    }

    onRequestNewQuotation() {
        this.bpDataService.initRfqWithQuotation();
        this.bpDataService.setBpOptionParameters("buyer", "Negotiation", "Negotiation");
    }

    onAcceptAndOrder() {
        this.bpDataService.initOrderWithQuotation();
        this.bpDataService.setBpOptionParameters("buyer", "Order", "Negotiation");
    }

    /*
     * Getters and Setters
     */

    isLoading(): boolean {
        return false;
    }

    getPresentationMode(): "edit" | "view" {
        return this.isReadOnly() ? "view" : "edit";
    }

    isReadOnly(): boolean {
        return this.bpDataService.processMetadata == null || this.bpDataService.processMetadata.processStatus !== 'Started';
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

}
