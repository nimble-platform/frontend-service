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
import {BpActivityEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {DiscountPriceWrapper} from "../../../common/discount-price-wrapper";
import {copy} from "../../../common/utils";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "transport-negotiation-response",
    templateUrl: "./transport-negotiation-response.component.html",
    styleUrls: ["./transport-negotiation-response.component.css"]
})
export class TransportNegotiationResponseComponent implements OnInit {

    @Input() rfq: RequestForQuotation;
    rfqPrice: DiscountPriceWrapper;
    rfqPaymentTerms: PaymentTermsWrapper;

    @Input() quotation: Quotation;
    quotationPrice: DiscountPriceWrapper;
    quotationPaymentTerms: PaymentTermsWrapper;

    @Input() readonly: boolean = false;

    selectedTab: string = "OVERVIEW";
    userRole: BpUserRole;
    formerProcess: boolean;

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
                private translate: TranslateService,
                private router: Router) {
                    translate.setDefaultLang("en");
                    translate.use(translate.getBrowserLang());
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;
        this.formerProcess = this.bpDataService.bpActivityEvent.formerProcess;

        if(!this.rfq) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        this.rfqPrice = new DiscountPriceWrapper(
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.bpDataService.getCatalogueLine().requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        //this.rfqPrice.quotationLinePriceWrapper = new ItemPriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.paymentTerms);

        if(!this.quotation) {
            this.quotation = this.bpDataService.quotation;
        }
        this.quotationPrice = new DiscountPriceWrapper(
            this.quotation.quotationLine[0].lineItem.price,
            this.quotation.quotationLine[0].lineItem.price,
            this.bpDataService.getCatalogueLine().requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        //this.quotationPrice.quotationLinePriceWrapper = new ItemPriceWrapper(this.quotation.quotationLine[0].lineItem.price);
        this.quotationPaymentTerms = new PaymentTermsWrapper(this.quotation.paymentTerms);

        this.userRole = this.bpDataService.bpActivityEvent.userRole;
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
        this.callStatus.submit();
        if(accepted) {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.ACCEPTED;
        } else {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.REJECTED;
        }

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.sellerSupplierParty.party), this.cookieService.get("user_id"),this.quotation, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.processMetadata.processInstanceId);

        //this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim)
            .then(res => {
                this.callStatus.callback("Quotation sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
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
