import { Component, OnInit, Input } from "@angular/core";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { INCOTERMS, PAYMENT_MEANS, CURRENCIES, NEGOTIATION_RESPONSES } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BpUserRole } from "../../model/bp-user-role";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { BPEService } from "../../bpe.service";
import {CookieService} from 'ng2-cookies';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {DiscountPriceWrapper} from "../../../common/discount-price-wrapper";
import {TranslateService} from '@ngx-translate/core';
import {dateToString, quantityToString} from '../../../common/utils';

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

    quantityToString = quantityToString;
    selectedTab: string = "OVERVIEW";
    userRole: BpUserRole;

    callStatus: CallStatus = new CallStatus();

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    CURRENCIES: string[] = CURRENCIES;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    dateToString=dateToString;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private translate: TranslateService,
                private router: Router) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        if(!this.rfq) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        this.rfqPrice = new DiscountPriceWrapper(
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.bpDataService.getCatalogueLine().requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        //this.rfqPrice.quotationLinePriceWrapper = new ItemPriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.requestForQuotationLine[0].lineItem.paymentTerms);

        if(!this.quotation) {
            this.quotation = this.bpDataService.quotation;
        }
        this.quotationPrice = new DiscountPriceWrapper(
            this.quotation.quotationLine[0].lineItem.price,
            this.quotation.quotationLine[0].lineItem.price,
            this.bpDataService.getCatalogueLine().requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        //this.quotationPrice.quotationLinePriceWrapper = new ItemPriceWrapper(this.quotation.quotationLine[0].lineItem.price);
        this.quotationPaymentTerms = new PaymentTermsWrapper(this.quotation.quotationLine[0].lineItem.paymentTerms);

        this.userRole = this.bpDataService.bpActivityEvent.userRole;
    }

    isDisabled(): boolean {
        return this.isResponseSent() || this.isLoading() || this.readonly;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
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

        //this.callStatus.submit();
        this.bpeService.startProcessWithDocument(this.quotation,this.quotation.sellerSupplierParty.party.federationInstanceID)
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
        this.bpDataService.setCopyDocuments(true, true, false,false);
        this.bpDataService.proceedNextBpStep("buyer", "Negotiation");
    }

    onAcceptAndOrder() {
        this.bpDataService.setCopyDocuments(false, true, false,false);
        this.bpDataService.proceedNextBpStep(this.userRole,'Transport_Execution_Plan');
    }

    // methods to check whether the term is updated in the negotiation response or not

    hasUpdatedTerms():boolean{
        return this.isDeliveryPeriodUpdated() || this.isSpecialTermsUpdated() || this.isStartDateUpdated() || this.isEndDateUpdated() || this.isIncotermsUpdated() || this.isPaymentTermsUpdated() ||
            this.isPaymentMeansUpdated() || this.isPriceUpdated() || this.isNoteUpdated();
    }

    isDeliveryPeriodUpdated(){
        return (this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value != this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.value) ||
            (this.rfq.requestForQuotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode != this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.durationMeasure.unitCode);
    }

    isSpecialTermsUpdated(){
        return (this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms[0].value != this.quotation.quotationLine[0].lineItem.deliveryTerms.specialTerms[0].value);
    }

    isStartDateUpdated(){
        return (this.rfq.delivery.requestedDeliveryPeriod.startDate != this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.startDate);
    }

    isEndDateUpdated(){
        return (this.rfq.delivery.requestedDeliveryPeriod.endDate != this.quotation.quotationLine[0].lineItem.delivery[0].requestedDeliveryPeriod.endDate);
    }

    isIncotermsUpdated(){
        return (this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.incoterms != this.quotation.quotationLine[0].lineItem.deliveryTerms.incoterms);
    }

    isPaymentTermsUpdated(){
        return (this.rfqPaymentTerms.paymentTerm != this.quotationPaymentTerms.paymentTerm);
    }

    isPaymentMeansUpdated(){
        return (this.rfq.requestForQuotationLine[0].lineItem.paymentMeans.paymentMeansCode.value != this.quotation.quotationLine[0].lineItem.paymentMeans.paymentMeansCode.value);
    }

    isPriceUpdated(){
        return (this.rfqPrice.itemPrice.value != this.quotationPrice.itemPrice.value) || (this.rfqPrice.itemPrice.currency != this.quotationPrice.itemPrice.currency);
    }

    isNoteUpdated(){
        return ((this.quotation.note.length == 1 && this.quotation.note[0] != "") || this.quotation.note.length > 1 || this.quotation.additionalDocumentReference.length > 0);
    }
}
