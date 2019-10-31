import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {CatalogueLine} from '../../../catalogue/model/publish/catalogue-line';
import {BPDataService} from '../bp-data-service';
import {CURRENCIES} from '../../../catalogue/model/constants';
import {RequestForQuotation} from '../../../catalogue/model/publish/request-for-quotation';
import {CallStatus} from '../../../common/call-status';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';
import {CookieService} from 'ng2-cookies';
import {NegotiationModelWrapper} from './negotiation-model-wrapper';
import {copy, durationToString, trimRedundantDecimals, validateNumberInput} from '../../../common/utils';
import {PeriodRange} from '../../../user-mgmt/model/period-range';
import {Option} from '../../../common/options-input.component';
import {addressToString} from '../../../user-mgmt/utils';
import {DiscountModalComponent} from '../../../product-details/discount-modal.component';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import * as myGlobals from '../../../globals';
import {DigitalAgreement} from '../../../catalogue/model/publish/digital-agreement';
import {UnitService} from '../../../common/unit-service';
import {FRAME_CONTRACT_DURATION_TERM_NAME, frameContractDurationUnitListId} from '../../../common/constants';
import {Quantity} from '../../../catalogue/model/publish/quantity';
import {Quotation} from '../../../catalogue/model/publish/quotation';
import {Clause} from '../../../catalogue/model/publish/clause';
import {CustomTermModalComponent} from './custom-term-modal.component';
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
    selector: "negotiation-request-item",
    templateUrl: "./negotiation-request-item.component.html",
    styleUrls: ["./negotiation-request-item.component.css"]
})
export class NegotiationRequestItemComponent implements OnInit {

    /**
     * View data fields
     */

    @Input() selectedLine: CatalogueLine;
    @Input() rfq: RequestForQuotation;
    @Input() wrapper: NegotiationModelWrapper;
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
    @Input() deliverytermsOfBuyer = null;

    /**
     * View control fields
     */
    @Input() processMetadata: ThreadEventMetadata;
    @Input() manufacturersTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer';
    counterOfferTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = this.manufacturersTermsSource;
    showCounterOfferTerms:boolean = false;
    showFrameContractDetails: boolean = false;
    frameContractAvailable: boolean = false;
    showDataMonitoring: boolean = false;
    showDeliveryAddress: boolean = false;
    showTermsAndConditions:boolean = false;
    selectedTCTab: 'CUSTOM_TERMS' | 'CLAUSES' = 'CUSTOM_TERMS';
    clausesDiffer: boolean = false;
    custTermsDiffer: boolean = false;
    resetUpdatesChecked: boolean = false;
    callStatus: CallStatus = new CallStatus();

    /**
     * Logic control fields
     */
    dirtyNegotiationFields: any = {}; // keeps the negotiation fields that are updated by the user
    enableDirtyUpdate: boolean = true; // if true, dirty map is update updated with user activities, otherwise the map is not updated in onTermsChange method.
    // the aim is to prevent updating dirty map when the terms sources is changed.

    onOrderQuantityKeyPressed = validateNumberInput;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;
    @ViewChild(CustomTermModalComponent)
    private customTermModal: CustomTermModalComponent;

    CURRENCIES: string[] = CURRENCIES;
    FIXED_NEGOTIATION_TERMS = FIXED_NEGOTIATION_TERMS;
    config = myGlobals.config;

    constructor(private bpDataService: BPDataService,
                private unitService: UnitService,
                private cookieService: CookieService,
                private translate: TranslateService) {

    }

    ngOnInit() {
        if(this.manufacturersTermsSource == null){
            this.manufacturersTermsSource = 'product_defaults';
        }

        this.sellerId = UBLModelUtils.getPartyId(this.wrapper.catalogueLine.goodsItem.item.manufacturerParty);
        this.buyerId = this.cookieService.get("company_id");

        let frameContractDuration = UBLModelUtils.getFrameContractDurationFromRfqLine(this.rfq.requestForQuotationLine[this.wrapper.lineIndex]);
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
        this.wrapper.initialImmutableRfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause = copy(this.defaultTermsAndConditions);

        // initialize dirty terms at the beginning so that the term source change would not affect them
        this.initializeDirtyTerms();

        // update the price based on the updated conditions
        // this is required to initialize the line discount wrapper with the terms from rfq
        this.onPriceConditionsChange();

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

    onClauseUpdate(event, wrapper: NegotiationModelWrapper): void {
        this.clausesDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(
            wrapper.initialImmutableRfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause,
            this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause);
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

        // we disable dirty update because we don't want update it when the terms source is changed
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
            this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause = copy(quotationWrapper.quotation.quotationLine[this.wrapper.lineIndex].lineItem.clause);
            // }
            this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.tradingTerms = copy(quotationWrapper.tradingTerms);
            this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.dataMonitoringRequested = quotationWrapper.dataMonitoringPromised;

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
            this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause = copy(this.defaultTermsAndConditions);
            // }
            this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.tradingTerms = [];
        }

        this.counterOfferTermsSource = termSource;
        // enable the dirty update in the next cycle when the events are process from this cycle
        setImmediate(() => this.enableDirtyUpdate = true);
        // uncheck the reset updates input after a term source is selected
        this.resetUpdatesChecked = false;
    }

    onPriceConditionsChange(): void {
        // update the discount price this.wrapper with the active trading terms
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

    onFrameContractDurationChanged(quantity: Quantity): void {
        if (!UBLModelUtils.isEmptyOrIncompleteQuantity(quantity)) {
            this.wrapper.rfqFrameContractDuration = quantity;
        } else {
            this.wrapper.deleteRfqTradingTerm(FRAME_CONTRACT_DURATION_TERM_NAME);
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
            clausesDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(quotationWrapper.quotation.quotationLine[this.wrapper.lineIndex].lineItem.clause, this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause);
            dataDataMonitoringRequestDiffers = !quotationWrapper.dataMonitoringPromised ? this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.dataMonitoringRequested : false;

        } else {
            priceDiffers = this.wrapper.rfqPricePerItemString != this.wrapper.lineDiscountPriceWrapper.discountedPricePerItemString;
            deliveryPeriodDiffers = this.wrapper.rfqDeliveryPeriodString != this.wrapper.lineDeliveryPeriodString;
            warrantyDiffers = this.wrapper.rfqWarrantyString != this.wrapper.lineWarrantyString;
            incotermDiffers = this.wrapper.rfqIncoterms != this.wrapper.lineIncoterms;
            paymentTermDiffers = this.wrapper.rfqPaymentTerms.paymentTerm != this.wrapper.linePaymentTerms;
            paymentMeansDiffers = this.wrapper.rfqPaymentMeans != this.wrapper.linePaymentMeans;

            // although the product default terms are selected, the following two conditions are calculated using the rfq itself
            frameContractDurationDiffers = this.dirtyNegotiationFields[FIXED_NEGOTIATION_TERMS.FRAME_CONTRACT_DURATION] &&
                !UBLModelUtils.areQuantitiesEqual(this.frameContractDuration, UBLModelUtils.getFrameContractDurationFromRfqLine(this.wrapper.initialImmutableRfq.requestForQuotationLine[this.wrapper.lineIndex]));
            customTermsDiffer = this.wrapper.rfqTradingTerms.length > 0 ? true : false;
            clausesDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(this.wrapper.initialImmutableRfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause, this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.clause);
            dataDataMonitoringRequestDiffers = this.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.dataMonitoringRequested;
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

    lineHasPrice(): boolean {
        return this.wrapper.lineDiscountPriceWrapper.itemPrice.hasPrice();
    }

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


    getQuantityUnit(): string {
        if(!this.wrapper.catalogueLine) {
            return "";
        }
        return this.wrapper.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode || "";
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
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

    // getTermAndConditions(): Clause[] {
    //     //     if(this.manufacturersTermsSource == 'product_defaults') {
    //     //         console.log("pd");
    //     //         return this.wrappers.initialImmutableRfq.termOrCondition;
    //     //     } else if(this.manufacturersTermsSource == 'frame_contract') {
    //     //         console.log("fc");
    //     //         return this.wrappers.frameContractQuotation.termOrCondition;
    //     //     } else {
    //     //         console.log("lo");
    //     //         return this.wrappers.lastOfferQuotation.termOrCondition;
    //     //     }
    //     // }

    getNonFrameContractTermNumber(): number {
        let termCount: number = 0;
        for(let tradingTerm of this.wrapper.rfq.requestForQuotationLine[this.wrapper.lineIndex].lineItem.tradingTerms) {
            if(tradingTerm.id != 'FRAME_CONTRACT_DURATION') {
                termCount++;
            }
        }
        return termCount;
    }

    areTermsEqual(termId: string,wrapper:NegotiationModelWrapper): boolean {
        let termsEqual: boolean = wrapper.checkTermEquivalance(this.manufacturersTermsSource, termId);
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
        const settings = this.wrapper.sellerSettings;

        const index = settings.deliveryPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.deliveryPeriodRanges[index] : null;
    }

    private getWarrantyPeriodRange(): PeriodRange | null {
        const unit = this.wrapper.rfqWarranty.unitCode;
        const settings = this.wrapper.sellerSettings;

        const index = settings.warrantyPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.warrantyPeriodRanges[index] : null;
    }

    private isPeriodValid(value: number, range: PeriodRange): boolean {
        if(typeof value !== "number") {
            return true;
        }

        return value >= range.start && value <= range.end;
    }

    private openDiscountModal(wrapper:NegotiationModelWrapper): void{
        this.discountModal.open(wrapper.lineDiscountPriceWrapper);
    }

    private openCustomTermModal(): void {
        this.customTermModal.open();
    }

    showTab(tab:boolean):boolean {
        let ret = true;
        if (tab)
            ret = false;
        this.showFrameContractDetails = false;
        this.showDataMonitoring = false;
        this.showDeliveryAddress = false;
        this.showTermsAndConditions = false;
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

    public getFrameContractDuration(){
        return this.frameContractDuration;
    }
}
