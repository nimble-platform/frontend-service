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
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';
import * as myGlobals from '../../../globals';
import {isValidPrice} from "../../../common/utils";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import * as moment from "moment";
import {Moment, unitOfTime} from "moment";
import {Clause} from '../../../catalogue/model/publish/clause';

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {

    dateFormat = "YYYY-MM-DD";

    line: CatalogueLine;
    @Input() rfq: RequestForQuotation;
    @Input() quotation: Quotation;
    @Input() lastOfferQuotation: Quotation;
    @Input() frameContractQuotation: Quotation;
    @Input() frameContract: DigitalAgreement;
    @Input() frameContractNegotiation: boolean = false;
    @Input() defaultTermsAndConditions: Clause[];
    @Input() primaryTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = 'product_defaults';
    @Input() readonly: boolean = false;
    @Input() formerProcess: boolean;
    wrapper: NegotiationModelWrapper;
    userRole: BpUserRole;
    quotationTotalPrice: Quantity;
    config = myGlobals.config;

    CURRENCIES: string[] = CURRENCIES;

    callStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    getPartyId = UBLModelUtils.getPartyId;
    showFrameContractDetails: boolean = false;
    showNotesAndAdditionalFiles: boolean = false;
    showDeliveryAddress: boolean = false;
    showTermsAndConditions:boolean = false;
    showPurchaseOrder:boolean = false;
    selectedTCTab: 'CUSTOM_TERMS' | 'CLAUSES' = 'CUSTOM_TERMS';
    tcChanged:boolean = false;

    onClauseUpdate(event): void {
        this.tcChanged = UBLModelUtils.areTermsAndConditionListsDifferent(this.wrapper.rfq.termOrCondition, this.wrapper.newQuotation.termOrCondition);
    }

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;
        this.line = this.bpDataService.getCatalogueLine();
        if(this.rfq == null) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        if(this.quotation == null) {
            this.quotation = this.bpDataService.quotation;
        }
        this.wrapper = new NegotiationModelWrapper(
            this.line,
            this.rfq,
            this.quotation,
            this.frameContractQuotation,
            this.lastOfferQuotation,
            this.bpDataService.getCompanySettings().negotiationSettings);

        this.wrapper.lineDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.discountedPricePerItem;
        this.quotationTotalPrice = new Quantity(this.wrapper.quotationDiscountPriceWrapper.totalPrice, this.wrapper.quotationDiscountPriceWrapper.currency);

        this.userRole = this.bpDataService.bpActivityEvent.userRole;

        // change the selected TC tab if there is no custom trading term
        if(this.getNonFrameContractTermNumber() == 0) {
            this.selectedTCTab = 'CLAUSES';
        }

        // initialize data monitoring request based on the frame contract and last offer
        if (this.lastOfferQuotation) {
            this.quotation.dataMonitoringPromised = this.lastOfferQuotation.dataMonitoringPromised;
        } else if (this.frameContractQuotation) {
           this.quotation.dataMonitoringPromised = this.frameContractQuotation.dataMonitoringPromised;
        }
    }

    onBack(): void {
        this.location.back();
    }

    onRespondToQuotation(accepted: boolean) {
        this.callStatus.submit();
        if (!isValidPrice(this.wrapper.quotationDiscountPriceWrapper.totalPrice)) {
            this.callStatus.callback("Quotation aborted", true);
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

        //this.callStatus.submit();
        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.sellerSupplierParty.party),this.cookieService.get("user_id"), this.quotation, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.processMetadata.processInstanceId);

        this.bpeService.continueBusinessProcess(piim).then(() => {
            this.callStatus.callback("Quotation sent", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

        }).catch(error => {
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

    onTotalPriceChanged(totalPrice: number): void {
        this.wrapper.quotationDiscountPriceWrapper.totalPrice = totalPrice;
    }

    onTCTabSelect(event): void {
        event.preventDefault();
        this.selectedTCTab = event.target.id;
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

    isFrameContractPanelVisible(): boolean {
        return !UBLModelUtils.isEmptyQuantity(this.wrapper.rfqFrameContractDuration);
    }

    isDiscountIconVisibleInCustomerRequestColumn(): boolean {
        return this.wrapper.quotationDiscountPriceWrapper.appliedDiscounts.length > 0 &&
            this.wrapper.rfqTotalPriceString == this.wrapper.lineDiscountPriceWrapper.totalPriceString;
    }

    getContractEndDate(): string {
        let rangeUnit: string;
        switch (this.wrapper.newQuotationWrapper.frameContractDuration.unitCode) {
            case "year(s)": rangeUnit = 'y'; break;
            case "month(s)": rangeUnit = 'M'; break;
            case "week(s)": rangeUnit = 'w'; break;
            case "day(s)": rangeUnit = 'd'; break;
        }
        let m:Moment = moment().add(this.wrapper.newQuotationWrapper.frameContractDuration.value, <unitOfTime.DurationConstructor>rangeUnit);
        let date: string = m.format(this.dateFormat);
        return date;
    }

    isFormValid(): boolean {
        // TODO check other elements
        return this.isFrameContractDurationValid();
    }

    isSellerTermsVisible(): boolean {
        return !(this.quotation.documentStatusCode.name == 'Rejected' && this.isReadOnly());
    }

    isTermDropDownVisible(): boolean {
        return this.lastOfferQuotation != null || (this.frameContractQuotation != null && !this.frameContractNegotiation);
    }

    getNonFrameContractTermNumber(): number {
        let termCount: number = 0;
        for(let tradingTerm of this.wrapper.newQuotation.tradingTerms) {
            if(tradingTerm.id != 'FRAME_CONTRACT_DURATION') {
                termCount++;
            }
        }
        return termCount;
    }

    areTermsEqual(termId: string): boolean {
        let termsEqual: boolean = this.wrapper.checkTermEquivalance(this.primaryTermsSource, termId);
        if(!termsEqual) {
            this.tcChanged = true;
        }
        return termsEqual;
    }

    /*
     * Internal Methods
     */

    hasUpdatedTerms(): boolean {
        if(!UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqDeliveryPeriod, this.wrapper.newQuotationWrapper.deliveryPeriod)) {
            return true;
        }
        if(this.wrapper.rfqIncoterms !== this.wrapper.newQuotationWrapper.incoterms) {
            return true;
        }
        if(this.wrapper.rfqPaymentMeans !== this.wrapper.newQuotationWrapper.paymentMeans) {
            return true;
        }
        if(this.wrapper.rfqPaymentTerms.paymentTerm !== this.wrapper.newQuotationWrapper.paymentTermsWrapper.paymentTerm) {
            return true;
        }
        if(this.wrapper.rfqDiscountPriceWrapper.totalPriceString !== this.wrapper.quotationDiscountPriceWrapper.totalPriceString) {
            return true;
        }
        if(!UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqWarranty, this.wrapper.newQuotationWrapper.warranty)) {
            return true;
        }
        if(!UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqFrameContractDuration, this.wrapper.newQuotationWrapper.frameContractDuration)) {
            return true;
        }
        if(UBLModelUtils.areTermsAndConditionListsDifferent(this.wrapper.rfq.termOrCondition, this.wrapper.newQuotation.termOrCondition)) {
            return true;
        }

        return false;
    }

    private isFrameContractDurationValid(): boolean {
        if(this.frameContract.digitalAgreementTerms.validityPeriod.durationMeasure.unitCode != null &&
            this.frameContract.digitalAgreementTerms.validityPeriod.durationMeasure.value != null) {
            return true;
        }
        return false;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.quotationDiscountPriceWrapper);
    }

    showTab(tab:boolean):boolean {
      let ret = true;
      if (tab)
        ret = false;
      this.showFrameContractDetails = false;
      this.showNotesAndAdditionalFiles = false;
      this.showDeliveryAddress = false;
      this.showTermsAndConditions = false;
      this.showPurchaseOrder = false;
      return ret;
    }

}
