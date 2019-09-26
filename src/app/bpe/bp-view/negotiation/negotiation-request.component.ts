import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {CatalogueLine} from "../../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "../bp-data-service";
import {CURRENCIES} from "../../../catalogue/model/constants";
import {RequestForQuotation} from "../../../catalogue/model/publish/request-for-quotation";
import {RequestForQuotationLine} from "../../../catalogue/model/publish/request-for-quotation-line";
import {Location} from "@angular/common";
import {CallStatus} from "../../../common/call-status";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {BPEService} from "../../bpe.service";
import {UserService} from "../../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {Router} from "@angular/router";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {NegotiationModelWrapper} from "./negotiation-model-wrapper";
import {copy, durationToString, getMaximumQuantityForPrice, getStepForPrice, isValidPrice, roundToTwoDecimals, trimRedundantDecimals} from "../../../common/utils";
import {PeriodRange} from "../../../user-mgmt/model/period-range";
import {Option} from "../../../common/options-input.component";
import {addressToString} from "../../../user-mgmt/utils";
import {DocumentService} from "../document-service";
import {DiscountModalComponent} from "../../../product-details/discount-modal.component";
import {ThreadEventMetadata} from "../../../catalogue/model/publish/thread-event-metadata";
import * as myGlobals from "../../../globals";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import {UnitService} from "../../../common/unit-service";
import {frameContractDurationUnitListId} from "../../../common/constants";
import {Party} from "../../../catalogue/model/publish/party";
import {Quantity} from "../../../catalogue/model/publish/quantity";
import {Quotation} from "../../../catalogue/model/publish/quotation";
import {Clause} from "../../../catalogue/model/publish/clause";
import {CustomTermModalComponent} from "./custom-term-modal.component";
import {TranslateService} from '@ngx-translate/core';

enum FIXED_NEGOTIATION_TERMS {
    DELIVERY_PERIOD = 'deliveryPeriod',
    WARRANTY_PERIOD = 'warrantyPeriod',
    INCOTERMS = 'incoterms',
    PAYMENT_TERMS = 'paymentTerms',
    PAYMENT_MEANS = 'paymentMeans',
    PRICE = 'price',
    FRAME_CONTRACT_DURATION = 'frameContractDuration'
}

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    CURRENCIES: string[] = CURRENCIES;
    fixedTerms = FIXED_NEGOTIATION_TERMS;

    /**
     * View data fields
     */

    catalogueLine: CatalogueLine;
    rfq: RequestForQuotation;
    rfqLine: RequestForQuotationLine;
    wrapper: NegotiationModelWrapper;
    @Input() frameContract: DigitalAgreement = new DigitalAgreement();
    @Input() frameContractQuotation: Quotation;
    // whether the frame contract is being negotiated in the negotiation workflow containing this request
    // this input is added in order to control the visibility of the frame contract option while loading terms.
    // frame contract option is disabled when displaying the history through which the contract is being negotiated.
    @Input() frameContractNegotiation: boolean;
    @Input() lastOfferQuotation: Quotation;
    @Input() defaultTermsAndConditions: Clause[];
    frameContractDuration: Quantity = new Quantity(); // we have a dedicated variable to keep this in order not to create an empty trading term in the rfq
    frameContractDurationUnits: string[];

    manufacturersTermsExistence: any = {'product_defaults': true}; // a (term source -> boolean) map indicating the existence of term sources
    sellerId:string = null;
    buyerId:string = null;
    selectedAddressValue = "";
    deliverytermsOfBuyer = null;

    /**
     * View control fields
     */
    @Input() manufacturersTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = 'product_defaults';
    counterOfferTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = this.manufacturersTermsSource;
    showCounterOfferTerms:boolean = false;
    showFrameContractDetails: boolean = false;
    frameContractAvailable: boolean = false;
    showNotesAndAdditionalFiles: boolean = false;
    showDataMonitoring: boolean = false;
    showDeliveryAddress: boolean = false;
    showPurchaseOrder:boolean = false;
    showTermsAndConditions:boolean = false;
    selectedTCTab: 'CUSTOM_TERMS' | 'CLAUSES' = 'CUSTOM_TERMS';
    clausesDiffer: boolean = false;
    custTermsDiffer: boolean = false;
    resetUpdatesChecked: boolean = false;
    callStatus: CallStatus = new CallStatus();

    /**
     * Logic control fields
     */
    processMetadata: ThreadEventMetadata = null; // the copy of ThreadEventMetadata of the current business process
    processMetadataHistory: ThreadEventMetadata[];
    dirtyNegotiationFields: any = {}; // keeps the negotiation fields that are updated by the user
    enableDirtyUpdate: boolean = true; // if true, dirty map is update updated with user activities, otherwise the map is not updated in onTermsChange method.
                                        // the aim is to prevent updating dirty map when the terms sources is changed.


    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;
    @ViewChild(CustomTermModalComponent)
    private customTermModal: CustomTermModalComponent;

    config = myGlobals.config;

    onClauseUpdate(event): void {
        this.clausesDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(this.wrapper.initialImmutableRfq.termOrCondition, this.rfq.termOrCondition);
    }

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
                private unitService: UnitService,
                private cookieService: CookieService,
                private location: Location,
                private documentService: DocumentService,
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

        this.userService.getSettingsForParty(this.cookieService.get("company_id")).then(res => {
            this.deliverytermsOfBuyer = res.tradeDetails.deliveryTerms;
        });

        // get copy of ThreadEventMetadata of the current business process
        this.setProcessMetadataFields(this.bpDataService.bpActivityEvent.processHistory);

        // copying the original rfq so that the updates (which might be temporary) wouldn't effect the original document
        // if the document is updated, the cached one should be updated in the document service
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqLine = this.rfq.requestForQuotationLine[0];
        this.catalogueLine = this.bpDataService.getCatalogueLine();

        this.sellerId = UBLModelUtils.getPartyId(this.catalogueLine.goodsItem.item.manufacturerParty);
        this.buyerId = this.cookieService.get("company_id");

        let frameContractDuration = UBLModelUtils.getFrameContractDurationFromRfq(this.rfq);
        // if the rfq frame contract duration is not null, we are rendering the negotiation process in which the frame contract duration is also negotiated
        if(!UBLModelUtils.isEmptyQuantity(frameContractDuration)) {
            this.frameContractDuration = frameContractDuration;

        } else if(this.frameContract) {
            // initialize frame contract variables
            this.frameContractAvailable = true;
            // the frame contract option is visible only if the visible flag is true. this mainly aims to hide the frame contract option when the
            // contract itself is being negotiated
            if(!this.frameContractNegotiation) {
                this.manufacturersTermsExistence.frame_contract = true;
            }
        }

        // construct wrapper with the retrieved documents
        this.wrapper = new NegotiationModelWrapper(
            this.catalogueLine,
            this.rfq,
            null,
            this.frameContractQuotation,
            this.lastOfferQuotation,
            this.bpDataService.getCompanySettings().negotiationSettings);
        // terms select box value should be set before computing the negotiation options
        if (this.lastOfferQuotation) {
            this.manufacturersTermsExistence.last_offer = true;
        }
        // if a new business process is created load initial terms based on the selected terms source
        // ignore negotiation options is true as they are not calculated yet
        // rfq is provided with values in onLoadCounterOfferTerms. this is done after initializing the wrapper,
        // because onLoadCounterOfferTerms method requires the wrapper
        if(!this.processMetadata) {
            this.onLoadCounterOfferTerms(this.manufacturersTermsSource);
        }
        this.wrapper.initialImmutableRfq.termOrCondition = copy(this.defaultTermsAndConditions);

        // initialize dirty terms at the beginning so that the term source change would not affect them
        this.initializeDirtyTerms();
        // if the line does not have a price enable the price negotiation
        // if(!this.lineHasPrice) {
            // this.rfq.negotiationOptions.price = true;
        // }

        // load the terms based on the availability of the terms
        //this.onTermsSourceChange(this.primaryTermsSource);

        // update the price based on the updated conditions
        // this is required to initialize the line discount wrapper with the terms from rfq
        this.onPriceConditionsChange();

        // enable the price negotiation if the product does not have any price
        // if(this.manufacturersTermsSource == 'product_defaults' && !this.wrapper.lineDiscountPriceWrapper.itemPrice.hasPrice()) {
            // this.negotiatePrice = true;
        // }

        // set the flag for showing the counter terms if a new negotiation is being initiated
        if(this.processMetadata != null) {
            this.showCounterOfferTerms = true;
        }

        // get frame contract units
        this.unitService.getCachedUnitList(frameContractDurationUnitListId).then(list => {
           this.frameContractDurationUnits = list;
        });

        // set tc tab based on the existence of custom terms
        if(this.isReadOnly() && this.getNonFrameContractTermNumber() == 0) {
            this.selectedTCTab = 'CLAUSES';
        }
    }

    private setProcessMetadataFields(processHistory: ThreadEventMetadata[]): void {
        this.processMetadataHistory = this.bpDataService.bpActivityEvent.processHistory;
        if(!this.bpDataService.bpActivityEvent.newProcess) {
            this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;
        } else {
            if(this.processMetadataHistory.length > 0 && this.processMetadataHistory[0].processType == "Negotiation") {
                this.manufacturersTermsExistence.last_offer = true;
            }
        }
    }

    private initializeDirtyTerms() {
        if(this.manufacturersTermsSource == 'product_defaults') {
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.DELIVERY_PERIOD] = this.wrapper.lineDeliveryPeriodString !== this.wrapper.rfqDeliveryPeriodString;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.INCOTERMS] = this.wrapper.lineIncoterms !== this.wrapper.rfqIncoterms;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_MEANS] = this.wrapper.linePaymentMeans !== this.wrapper.rfqPaymentMeans;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_TERMS] = this.wrapper.linePaymentTerms !== this.wrapper.rfqPaymentTermsToString;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PRICE] = this.wrapper.lineDiscountPriceWrapper.discountedPricePerItem !== this.wrapper.rfqDiscountPriceWrapper.pricePerItem;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.WARRANTY_PERIOD] = this.wrapper.lineWarrantyString !== this.wrapper.rfqWarrantyString;

        } else {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(this.manufacturersTermsSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.DELIVERY_PERIOD] = quotationWrapper.deliveryPeriodString !== this.wrapper.rfqDeliveryPeriodString;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.INCOTERMS] = quotationWrapper.incoterms !== this.wrapper.rfqIncoterms;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_MEANS] = quotationWrapper.paymentMeans !== this.wrapper.rfqPaymentMeans;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_TERMS] = quotationWrapper.paymentTermsWrapper.paymentTerm !== this.wrapper.rfqPaymentTermsToString;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PRICE] = quotationWrapper.priceWrapper.pricePerItem !== this.wrapper.rfqDiscountPriceWrapper.discountedPricePerItem;
            this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.WARRANTY_PERIOD] = quotationWrapper.warrantyString !== this.wrapper.rfqWarrantyString;
        }
    }

    /*
     * Event handlers
     */

    onSendRequest(): void {
        this.callStatus.submit();
        if (this.wrapper.rfqDiscountPriceWrapper.itemPrice.hasPrice()) {
            if (!isValidPrice(this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount.value)) {
                this.callStatus.callback("Terms aborted", true);
                alert("Price cannot have more than 2 decimal places");
                return;
            }
        }
        if(!this.doesManufacturerOfferHasPrice() || this.isNegotiatingAnyTerm() || this.bpDataService.isFinalProcessInTheWorkflow("Negotiation")) {
            // create an additional trading term for the frame contract duration
            if(/*this.rfq.negotiationOptions.frameContractDuration && */!UBLModelUtils.isEmptyOrIncompleteQuantity(this.frameContractDuration)) {
                this.wrapper.rfqFrameContractDuration = this.frameContractDuration;
            }

            // final check on the rfq
            const rfq: RequestForQuotation = copy(this.rfq);
            UBLModelUtils.removeHjidFieldsFromObject(rfq);

            // send request for quotation
            let sellerParty: Party;
            let buyerParty: Party;
            Promise.all([
                this.userService.getParty(this.buyerId),
                this.userService.getParty(this.sellerId),

            ]).then(([buyerPartyResp, sellerPartyResp]) => {
                sellerParty = sellerPartyResp;
                buyerParty = buyerPartyResp;
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                return this.bpeService.startProcessWithDocument(rfq);

            }).then(() => {
                this.callStatus.callback("Terms sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

            }).catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            this.callStatus.callback("Terms sent", true);
            // set the item price, otherwise we will lose item price information
            this.bpDataService.requestForQuotation.requestForQuotationLine[0].lineItem.price.priceAmount.value = this.wrapper.rfqDiscountPriceWrapper.totalPrice/this.wrapper.rfqDiscountPriceWrapper.orderedQuantity.value;
            // just go to order page
            this.bpDataService.setCopyDocuments(true, false, false);
            this.bpDataService.proceedNextBpStep("buyer", "Order")
        }
    }

    onUpdateRequest(): void {
        this.callStatus.submit();

        // check frame contract explicitly. this is required e.g. if the frame contract is specified in the update itself.
        if(/*this.rfq.negotiationOptions.frameContractDuration && */!UBLModelUtils.isEmptyOrIncompleteQuantity(this.frameContractDuration)) {
            this.wrapper.rfqFrameContractDuration = this.frameContractDuration;
        }

        const rfq: RequestForQuotation = copy(this.rfq);
        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processInstanceId).then(() => {
            this.documentService.updateCachedDocument(rfq.id,rfq);
            this.callStatus.callback("Terms updated", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        }).catch(error => {
            this.callStatus.error("Failed to update Terms", error);
        });
    }

    onBack(): void {
        this.location.back();
    }

    onOrderQuantityKeyPressed(event:any): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    onOrderQuantityChange(): void {
        // quantity change must be activated in the next iteration of execution
        // otherwise, the update discount method will use the old value of the quantity
        setTimeout((()=>{
            this.onPriceConditionsChange();
        }), 0);
    }

    onManufacturersTermsSourceChange(termSource: 'product_defaults' | 'frame_contract' | 'last_offer'): void {
        this.manufacturersTermsSource = termSource;
        // if the counter offer panel is not shown, then the selection of terms source should update the the rfq
        if(!this.showCounterOfferTerms) {
            this.onLoadCounterOfferTerms(termSource);
        }
    }

    onLoadCounterOfferTerms(termSource: 'product_defaults' | 'frame_contract' | 'last_offer'): void {
        // if changes are overwritten, users preferences should be reset
        if(this.resetUpdatesChecked) {
            this.dirtyNegotiationFields = {};
        }

        // we disable dirty update because we don't want that dirty map when the terms sources is changed
        this.enableDirtyUpdate = false;

        if(termSource == 'frame_contract' || termSource == 'last_offer') {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(termSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.DELIVERY_PERIOD]) {
                this.wrapper.rfqDeliveryPeriod = copy(quotationWrapper.deliveryPeriod);
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.WARRANTY_PERIOD]) {
                this.wrapper.rfqWarranty = copy(quotationWrapper.warranty);
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_TERMS]) {
                this.wrapper.rfqPaymentTerms.paymentTerm = quotationWrapper.paymentTermsWrapper.paymentTerm;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.INCOTERMS]) {
                this.wrapper.rfqIncoterms = quotationWrapper.incoterms;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_MEANS]) {
                this.wrapper.rfqPaymentMeans = quotationWrapper.paymentMeans;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PRICE]) {
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = trimRedundantDecimals(quotationWrapper.priceWrapper.pricePerItem);
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = quotationWrapper.priceWrapper.currency;
            }

            if (termSource === 'last_offer' &&
                (this.resetUpdatesChecked ||
                    !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.FRAME_CONTRACT_DURATION] && quotationWrapper.frameContractDuration != null)) {
                this.frameContractDuration = copy(quotationWrapper.frameContractDuration);
            }
            // if(!this.rfq.negotiationOptions.termsAndConditions || ignoreNegotiationOptions) {
            this.rfq.termOrCondition = copy(quotationWrapper.quotation.termOrCondition);
            // }
            this.rfq.tradingTerms = copy(quotationWrapper.tradingTerms);
            this.rfq.dataMonitoringRequested = quotationWrapper.dataMonitoringPromised;

        } else if(termSource == 'product_defaults') {
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.DELIVERY_PERIOD]) {
                this.wrapper.rfqDeliveryPeriod = copy(this.wrapper.originalLineDeliveryPeriod);
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.WARRANTY_PERIOD]) {
                this.wrapper.rfqWarranty = copy(this.wrapper.originalLineWarranty);
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_TERMS]) {
                this.wrapper.rfqPaymentTerms.paymentTerm = this.wrapper.linePaymentTerms;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.INCOTERMS]) {
                this.wrapper.rfqIncoterms = this.wrapper.originalLineIncoterms;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PAYMENT_MEANS]) {
                this.wrapper.rfqPaymentMeans = this.wrapper.linePaymentMeans;
            }
            if(this.resetUpdatesChecked || !this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PRICE]) {
                this.onPriceConditionsChange();
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = trimRedundantDecimals(this.wrapper.lineDiscountPriceWrapper.pricePerItem);
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = this.wrapper.lineDiscountPriceWrapper.itemPrice.currency;
            }
            // if(!this.rfq.negotiationOptions.termsAndConditions || ignoreNegotiationOptions) {
            this.rfq.termOrCondition = copy(this.defaultTermsAndConditions);
            // }
            this.rfq.tradingTerms = [];
        }

        this.counterOfferTermsSource = termSource;
        // enable the dirty update in the next cycle when the events are process from this cycle
        setImmediate(() => this.enableDirtyUpdate = true);
        // uncheck the reset updates input after a term source is selected
        this.resetUpdatesChecked = false;
    }

    onPriceConditionsChange(): void {
        // update the discount price wrapper with the active trading terms
        this.wrapper.lineDiscountPriceWrapper.incoterm = this.wrapper.rfqIncoterms;
        this.wrapper.lineDiscountPriceWrapper.paymentMeans = this.wrapper.rfqPaymentMeans;
        this.wrapper.lineDiscountPriceWrapper.deliveryPeriod = this.wrapper.rfqDeliveryPeriod;
        this.wrapper.lineDiscountPriceWrapper.deliveryLocation = this.wrapper.rfqDeliveryAddress;
        // get the price per item including the discount
        this.wrapper.lineDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.discountedPricePerItem;

        // update the rfq price only if the price is not being negotiated and the default product terms are presented
        // it does not make sense to update price based on the discounts when the terms of frame contract or last offer terms are presented
        if(/*!this.rfq.negotiationOptions.price && */!this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.PRICE] && this.manufacturersTermsSource == 'product_defaults') {
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.discountedPricePerItem;
        }
    }

    onShowCounterOfferTerms(): void {
        // we disable dirty update because otherwise when the UI items are rendered for the first time, their values are set and they are marked as dirty
        this.enableDirtyUpdate = false;
        this.showCounterOfferTerms = !this.showCounterOfferTerms;

        // enable the dirty update in the next cycle when the events are process from this cycle
        setImmediate(() => this.enableDirtyUpdate = true);
    }

    onTermsChange(termId: string, affectsPrice: boolean = true): void {
        if(this.enableDirtyUpdate) {
            this.dirtyNegotiationFields[termId] = true;
        }
        if(affectsPrice) {
            this.onPriceConditionsChange();
        }
    }

    onTCTabSelect(event:any, id:any): void {
        event.preventDefault();
        this.selectedTCTab = id;
    }

    onDeleteTradingTerm(termName: string): void {
        this.wrapper.deleteRfqTradingTerm(termName);
        let termListsEqual: boolean = this.checkTradingTermListEquivalance();
        if(termListsEqual) {
            this.custTermsDiffer = false;
        }
    }

    /*
     * Getters and setters for the template.
     */

    isNegotiatingAnyTerm(): boolean {
        let priceDiffers: boolean;
        let deliveryPeriodDiffers: boolean;
        let warrantyDiffers: boolean;
        let incotermDiffers: boolean;
        let paymentTermDiffers: boolean;
        let paymentMeansDiffers: boolean;
        let frameContractDurationDiffers: boolean = false; // this is valid only in the second and subsequent steps of a negotiation process
        let customTermsDiffer: boolean;
        let clausesDiffer: boolean;
        let dataDataMonitoringRequestDiffers = false;

        if(this.counterOfferTermsSource == 'last_offer' || this.counterOfferTermsSource == 'frame_contract') {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(this.counterOfferTermsSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }

            priceDiffers = this.wrapper.rfqPricePerItemString != quotationWrapper.priceWrapper.itemPrice.pricePerItemString;
            deliveryPeriodDiffers = this.wrapper.rfqDeliveryPeriodString != quotationWrapper.deliveryPeriodString;
            warrantyDiffers = this.wrapper.rfqWarrantyString != quotationWrapper.warrantyString;
            incotermDiffers = this.wrapper.rfqIncoterms != quotationWrapper.incoterms;
            paymentTermDiffers = this.wrapper.rfqPaymentTerms.paymentTerm != quotationWrapper.paymentTermsWrapper.paymentTerm;
            paymentMeansDiffers = this.wrapper.rfqPaymentMeans != quotationWrapper.paymentMeans;
            frameContractDurationDiffers = this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.FRAME_CONTRACT_DURATION] &&
                durationToString(this.frameContractDuration) != quotationWrapper.rfqFrameContractDurationString;
            customTermsDiffer = !UBLModelUtils.areTradingTermListsEqual(this.wrapper.rfqTradingTerms, quotationWrapper.tradingTerms);
            clausesDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(quotationWrapper.quotation.termOrCondition, this.rfq.termOrCondition);
            dataDataMonitoringRequestDiffers = !quotationWrapper.dataMonitoringPromised ? this.rfq.dataMonitoringRequested : false;

        } else {
            priceDiffers = this.wrapper.rfqPricePerItemString != this.wrapper.lineDiscountPriceWrapper.discountedPricePerItemString;
            deliveryPeriodDiffers = this.wrapper.rfqDeliveryPeriodString != this.wrapper.lineDeliveryPeriodString;
            warrantyDiffers = this.wrapper.rfqWarrantyString != this.wrapper.lineWarrantyString;
            incotermDiffers = this.wrapper.rfqIncoterms != this.wrapper.lineIncoterms;
            paymentTermDiffers = this.wrapper.rfqPaymentTerms.paymentTerm != this.wrapper.linePaymentTerms;
            paymentMeansDiffers = this.wrapper.rfqPaymentMeans != this.wrapper.linePaymentMeans;

            // although the product default terms are selected, the following two conditions are calculated using the rfq itself
            frameContractDurationDiffers = this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.FRAME_CONTRACT_DURATION] &&
                !UBLModelUtils.areQuantitiesEqual(this.frameContractDuration, UBLModelUtils.getFrameContractDurationFromRfq(this.wrapper.initialImmutableRfq));
            customTermsDiffer = this.wrapper.rfqTradingTerms.length > 0 ? true : false;
            clausesDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(this.wrapper.initialImmutableRfq.termOrCondition, this.rfq.termOrCondition);
            dataDataMonitoringRequestDiffers = this.rfq.dataMonitoringRequested;
        }

        return priceDiffers ||
            deliveryPeriodDiffers ||
            warrantyDiffers ||
            incotermDiffers ||
            paymentTermDiffers ||
            paymentMeansDiffers ||
            frameContractDurationDiffers ||
            dataDataMonitoringRequestDiffers ||
            customTermsDiffer ||
            clausesDiffer;
    }

    isThereDirtyTerm(): boolean {
        for(let term of Object.keys(this.dirtyNegotiationFields)) {
            if(this.dirtyNegotiationFields[term]) {
                return true;
            }
        }
        return false;
    }

    get lineHasPrice(): boolean {
        return this.wrapper.lineDiscountPriceWrapper.itemPrice.hasPrice();
    }

    get requestedQuantity(): number {
        return this.rfq.requestForQuotationLine[0].lineItem.quantity.value;
    }

    set requestedQuantity(quantity: number) {
        this.rfq.requestForQuotationLine[0].lineItem.quantity.value = quantity;
    }

    // get negotiateDeliveryPeriod(): boolean {
    //     return this.rfq.negotiationOptions.deliveryPeriod;
    // }
    //
    // set negotiateDeliveryPeriod(negotiate: boolean) {
    //     this.rfq.negotiationOptions.deliveryPeriod = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiateWarranty(): boolean {
    //     return this.rfq.negotiationOptions.warranty;
    // }
    //
    // set negotiateWarranty(negotiate: boolean) {
    //     this.rfq.negotiationOptions.warranty = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiateIncoterm(): boolean {
    //     return this.rfq.negotiationOptions.incoterms;
    // }
    //
    // set negotiateIncoterm(negotiate: boolean) {
    //     this.rfq.negotiationOptions.incoterms = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiatePaymentTerm(): boolean {
    //     return this.rfq.negotiationOptions.paymentTerms;
    // }
    //
    // set negotiatePaymentTerm(negotiate: boolean) {
    //     this.rfq.negotiationOptions.paymentTerms = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiatePaymentMean(): boolean {
    //     return this.rfq.negotiationOptions.paymentMeans;
    // }
    //
    // set negotiatePaymentMean(negotiate: boolean) {
    //     this.rfq.negotiationOptions.paymentMeans = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiatePrice(): boolean {
    //     return this.rfq.negotiationOptions.price;
    // }
    //
    // set negotiatePrice(negotiate: boolean) {
    //     this.rfq.negotiationOptions.price = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiateFrameContractDuration(): boolean {
    //     return this.rfq.negotiationOptions.frameContractDuration;
    // }
    //
    // set negotiateFrameContractDuration(negotiate: boolean) {
    //     this.rfq.negotiationOptions.frameContractDuration = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }
    //
    // get negotiateTermsAndConditions(): boolean {
    //     return this.rfq.negotiationOptions.termsAndConditions;
    // }
    //
    // set negotiateTermsAndConditions(negotiate: boolean) {
    //     this.rfq.negotiationOptions.termsAndConditions = negotiate;
    //     if(!negotiate) {
    //         this.onTermsSourceChange(this.primaryTermsSource);
    //     }
    // }

    get selectedAddress(): string {
        return this.selectedAddressValue;
    }

    set selectedAddress(addressStr: string) {
        this.selectedAddressValue = addressStr;

        if(addressStr !== "") {
            const index = Number(addressStr);
            const address = this.deliverytermsOfBuyer[index].deliveryAddress;
            const rfqAddress = this.wrapper.rfqDeliveryAddress;
            rfqAddress.buildingNumber = address.buildingNumber;
            rfqAddress.cityName = address.cityName;
            rfqAddress.region = address.region;
            rfqAddress.country.name.value = address.country;
            rfqAddress.postalZone = address.postalCode;
            rfqAddress.streetName = address.streetName;
        }
    }

    get addressOptions(): Option[] {
            const deliveryTerms = this.deliverytermsOfBuyer;
            var ret = [];
            if (deliveryTerms.length == 0 || !deliveryTerms[0].deliveryAddress || !deliveryTerms[0].deliveryAddress.streetName) {
                ret = [
                    { name: "No", value: "" }
                ];
            }
            else {
                ret = [
                    { name: "No", value: "" }
                ].concat(deliveryTerms.map((term, i) => {
                    return { name: addressToString(term.deliveryAddress), value: String(i) };
                }));
            }
            return ret;
    }

    getPriceSteps(): number {
        return getStepForPrice(this.catalogueLine.requiredItemLocationQuantity.price);
    }

    getMaximumQuantity(): number {
        return getMaximumQuantityForPrice(this.catalogueLine.requiredItemLocationQuantity.price);
    }

    getQuantityUnit(): string {
        if(!this.catalogueLine) {
            return "";
        }
        return this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode || "";
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    doesManufacturerOfferHasPrice(): boolean{
        if(this.counterOfferTermsSource == 'last_offer' || this.counterOfferTermsSource == 'frame_contract') {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(this.counterOfferTermsSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }
            if(quotationWrapper.priceWrapper.itemPrice.pricePerItemString == "On demand"){
                return false;
            }
        } else if(this.wrapper.lineDiscountPriceWrapper.discountedPricePerItemString == "On demand"){
                return false;
        }

        return true;
    }

    isFormValid(): boolean {
        let formValid = /*!this.rfq.negotiationOptions.frameContractDuration ||*/ this.isFrameContractValid();
        formValid = formValid && this.isDeliveryPeriodValid() && this.isWarrantyPeriodValid();
        return formValid;
    }

    isWaitingForReply(): boolean {
        return this.processMetadata && this.processMetadata.processStatus === "Started";
    }

    showRequestedPrice(): boolean {
        return this.isWaitingForReply() && !this.processMetadata.isBeingUpdated;
    }

    isFrameContractValid(): boolean {
        // either the frame contract duration should be empty indicating that it is not being negotiated
        // or it should be provided with both a value and a unit
        return UBLModelUtils.isEmptyQuantity(this.frameContractDuration) || !UBLModelUtils.isEmptyOrIncompleteQuantity(this.frameContractDuration);
    }

    isFrameContractDisabled(): boolean {
        return this.isLoading() || !this.isFrameContractInEditMode();
    }

    /**
     * Frame contract is editable when (in addition to the edit mode)
     * 1) there is not a frame contract available for the product between the trading partners
     * 2) the current request for quotation have the corresponding trading term (e.g. this might occur during a second negotiation step)
     */
    isFrameContractInEditMode(): boolean {
        return !this.isReadOnly() && (!this.frameContractAvailable || this.frameContractNegotiation);
    }

    isFrameContractVisible(): boolean {
        return !this.frameContractAvailable || this.frameContractNegotiation;
    }

    getDeliveryPeriodText(): string {
        const range = this.getDeliveryPeriodRange();

        if(range) {
            const unit = this.wrapper.rfqDeliveryPeriod.unitCode;
            return ` (minimum: ${range.start} ${unit}, maximum: ${range.end} ${unit})`;
        }

        return "";
    }

    getDeliveryPeriodStyle(): any {
        const result: any = {}

        if(!this.isDeliveryPeriodValid()) {
            result["color"] = "red";
        }

        return result;
    }

    isDeliveryPeriodValid(): boolean {
        const range = this.getDeliveryPeriodRange();
        return !range || this.isPeriodValid(this.wrapper.rfqDeliveryPeriod.value, range);
    }

    getWarrantyPeriodText(): string {
        const range = this.getWarrantyPeriodRange();

        if(range) {
            const unit = this.wrapper.rfqWarranty.unitCode;
            return ` (minimum: ${range.start} ${unit}, maximum: ${range.end} ${unit})`;
        }

        return "";
    }

    getWarrantyPeriodStyle(): any {
        const result: any = {}

        if(!this.isWarrantyPeriodValid()) {
            result["color"] = "red";
        }

        return result;
    }

    isWarrantyPeriodValid(): boolean {
        const range = this.getWarrantyPeriodRange();
        return !range || this.isPeriodValid(this.wrapper.rfqWarranty.value, range);
    }

    isManufacturersTermsSelectBoxVisible(): boolean {
        return this.manufacturersTermsExistence.frame_contract == true || this.manufacturersTermsExistence.last_offer == true;
    }

    getTermAndConditions(): Clause[] {
        if(this.manufacturersTermsSource == 'product_defaults') {
            console.log("pd");
            return this.wrapper.initialImmutableRfq.termOrCondition;
        } else if(this.manufacturersTermsSource == 'frame_contract') {
            console.log("fc");
            return this.wrapper.frameContractQuotation.termOrCondition;
        } else {
            console.log("lo");
            return this.wrapper.lastOfferQuotation.termOrCondition;
        }
    }

    getNonFrameContractTermNumber(): number {
        let termCount: number = 0;
        for(let tradingTerm of this.wrapper.rfq.tradingTerms) {
            if(tradingTerm.id != 'FRAME_CONTRACT_DURATION') {
                termCount++;
            }
        }
        return termCount;
    }

    areTermsEqual(termId: string): boolean {
        let termsEqual: boolean = this.wrapper.checkTermEquivalance(this.manufacturersTermsSource, termId);
        if(!termsEqual) {
            this.custTermsDiffer = true;
        }
        return termsEqual;
    }

    /**
     * Internal methods
     */

    private getDeliveryPeriodRange(): PeriodRange | null {
        const unit = this.wrapper.rfqDeliveryPeriod.unitCode;
        const settings = this.wrapper.settings;

        const index = settings.deliveryPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.deliveryPeriodRanges[index] : null;
    }

    private getWarrantyPeriodRange(): PeriodRange | null {
        const unit = this.wrapper.rfqWarranty.unitCode;
        const settings = this.wrapper.settings;

        const index = settings.warrantyPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.warrantyPeriodRanges[index] : null;
    }

    private isPeriodValid(value: number, range: PeriodRange): boolean {
        if(typeof value !== "number") {
            return true;
        }

        return value >= range.start && value <= range.end;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.lineDiscountPriceWrapper);
    }

    private openCustomTermModal(): void {
        this.customTermModal.open();
    }

    showTab(tab:boolean):boolean {
      let ret = true;
      if (tab)
        ret = false;
      this.showFrameContractDetails = false;
      this.showNotesAndAdditionalFiles = false;
      this.showDataMonitoring = false;
      this.showDeliveryAddress = false;
      this.showTermsAndConditions = false;
      this.showPurchaseOrder = false;
      return ret;
    }

    private checkTradingTermListEquivalance(): boolean {
        let manufacturersTermList;
        if(this.manufacturersTermsSource == 'frame_contract') {
            manufacturersTermList = this.wrapper.frameContractQuotationWrapper.tradingTerms;
        } else if(this.manufacturersTermsSource == 'last_offer') {
            manufacturersTermList = this.wrapper.lastOfferQuotationWrapper.tradingTerms;
        }
        return UBLModelUtils.areTradingTermListsEqual(this.wrapper.rfqTradingTerms, manufacturersTermList);
    }
}
