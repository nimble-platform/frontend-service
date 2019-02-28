import { Component, OnInit, Input } from "@angular/core";
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
import {CookieService} from 'ng2-cookies';
import {ItemPriceWrapper} from '../../../common/item-price-wrapper';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';

@Component({
    selector: "transport-negotiation-response",
    templateUrl: "./transport-negotiation-response.component.html",
    styleUrls: ["./transport-negotiation-response.component.css"]
})
export class TransportNegotiationResponseComponent implements OnInit {

    @Input() rfq: RequestForQuotation;
    rfqPrice: PriceWrapper;
    rfqPaymentTerms: PaymentTermsWrapper;

    @Input() quotation: Quotation;
    quotationPrice: PriceWrapper;
    quotationPaymentTerms: PaymentTermsWrapper;

    @Input() readonly: boolean = false;

    selectedTab: string = "OVERVIEW";
    userRole: BpUserRole;

    callStatus: CallStatus = new CallStatus();

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    CURRENCIES: string[] = CURRENCIES;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        if(!this.rfq) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        this.rfqPrice = new PriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPrice.quantityPrice = new ItemPriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.paymentTerms);

        if(!this.quotation) {
            this.quotation = this.bpDataService.quotation;
        }
        this.quotationPrice = new PriceWrapper(this.quotation.quotationLine[0].lineItem.price);
        this.quotationPrice.quantityPrice = new ItemPriceWrapper(this.quotation.quotationLine[0].lineItem.price);
        this.quotationPaymentTerms = new PaymentTermsWrapper(this.quotation.paymentTerms);

        this.userRole = this.bpDataService.bpStartEvent.userRole;
    }

    isDisabled(): boolean {
        return this.isResponseSent() || this.isLoading() || this.readonly;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    isReadOnly(): boolean {
        return this.isResponseSent() || this.isLoading();
    }

    isResponseSent(): boolean {
        return this.processMetadata && this.processMetadata.processStatus !== 'Started';
    }

    onBack(): void {
        this.location.back();
    }

    onRespondToQuotation(accepted: boolean): void {
        if(accepted) {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.ACCEPTED;
        } else {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.REJECTED;
        }

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.sellerSupplierParty.party), this.cookieService.get("user_id"),this.quotation, this.bpDataService);
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
        this.bpDataService.initTransportExecutionPlanRequestWithQuotation();
        this.bpDataService.proceedNextBpStep(this.userRole,'Transport_Execution_Plan');
    }
}
