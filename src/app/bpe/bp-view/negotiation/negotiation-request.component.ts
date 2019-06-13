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
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
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
import {NegotiationOptions} from "../../../catalogue/model/publish/negotiation-options";
import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
import {Quotation} from "../../../catalogue/model/publish/quotation";
import {Clause} from "../../../catalogue/model/publish/clause";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    CURRENCIES: string[] = CURRENCIES;

    /**
     * View data fields
     */

    catalogueLine: CatalogueLine;
    rfq: RequestForQuotation;
    rfqLine: RequestForQuotationLine;
    wrapper: NegotiationModelWrapper;
    @Input() frameContract: DigitalAgreement = new DigitalAgreement();
    @Input() frameContractQuotation: Quotation;
    @Input() lastOfferQuotation: Quotation;
    @Input() primaryTermsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = 'product_defaults';
    @Input() defaultTermsAndConditions: Clause[];
    frameContractDuration: Quantity = new Quantity(); // we have a dedicated variable to keep this in order not to create an empty trading term in the rfq
    frameContractDurationUnits: string[];
    manufacturersTermsExistence: any = {'product_defaults': true}; // a (term source -> boolean) map indicating the existence of term sources
    sellerId:string = null;
    buyerId:string = null;
    selectedAddressValue = "";
    config = myGlobals.config;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata = null;
    processMetadataHistory: ThreadEventMetadata[];

    /**
     * View control fields
     */

    showCounterOfferTerms:boolean = false;
    showFrameContractDetails: boolean = false;
    frameContractAvailable: boolean = false;
    showNotesAndAdditionalFiles: boolean = false;
    showDataMonitoring: boolean = false;
    showDeliveryAddress: boolean = false;
    showPurchaseOrder:boolean = false;
    showTermsAndConditions:boolean = false;
    callStatus: CallStatus = new CallStatus();
    pageInitCallStatus: CallStatus = new CallStatus();

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
                private unitService: UnitService,
                private cookieService: CookieService,
                private location: Location,
                private documentService: DocumentService,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.setProcessMetadataFields(this.bpDataService.bpActivityEvent.processHistory);

        // copying the original rfq so that the updates (which might be temporary) wouldn't effect the original document
        // if the document is updated, the cached one should be updated in the document service
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqLine = this.rfq.requestForQuotationLine[0];
        this.catalogueLine = this.bpDataService.getCatalogueLine();

        this.sellerId = UBLModelUtils.getPartyId(this.catalogueLine.goodsItem.item.manufacturerParty);
        this.buyerId = this.cookieService.get("company_id");

        let frameContractDuration = this.getFrameContractDurationFromRfq(this.rfq);
        // if the rfq frame contract duration is not null, we are rendering the negotiation process in which the frame contract duration is also negotiated
        if(frameContractDuration != null) {
            this.frameContractDuration = frameContractDuration;

        } else if(this.frameContract) {
            // initialize frame contract variables
            this.frameContractAvailable = true;
            this.manufacturersTermsExistence.frame_contract = true;
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
        // rfq is provided with values in onTermsSourceChange. this is done after initializing the wrapper,
        // because this method requires the wrapper
        if(!this.processMetadata) {
            this.onTermsSourceChange(this.primaryTermsSource, true);
        }
        this.wrapper.initialImmutableRfq.termOrCondition = copy(this.defaultTermsAndConditions);

        // compute negotiation options for selecting the negotiation ticks automatically
        this.computeRfqNegotiationOptions(this.rfq);
        // if the line does not have a price enable the price negotiation
        if(!this.lineHasPrice) {
            this.rfq.negotiationOptions.price = true;
        }

        // load the terms based on the availability of the terms
        this.onTermsSourceChange(this.primaryTermsSource);

        // update the price based on the updated conditions
        // this is required to initialize the line discount wrapper with the terms from rfq
        this.onPriceConditionsChange();

        // set the flag for showing the counter terms if the presen
        if(this.processMetadata != null) {
            this.showCounterOfferTerms = true;
        }

        // get frame contract units
        this.unitService.getCachedUnitList(frameContractDurationUnitListId).then(list => {
           this.frameContractDurationUnits = list;
        });
    }

    private setProcessMetadataFields(processHistory: ThreadEventMetadata[]): void {
        this.processMetadataHistory = this.bpDataService.bpActivityEvent.processHistory;
        if(!this.bpDataService.bpActivityEvent.newProcess) {
            this.processMetadata = this.bpDataService.bpActivityEvent.processHistory[0];
        } else {
            if(this.processMetadataHistory.length > 0 && this.processMetadataHistory[0].processType == "Negotiation") {
                this.manufacturersTermsExistence.last_offer = true;
            }
        }
    }

    computeRfqNegotiationOptions(rfq: RequestForQuotation) {
        if(!rfq.negotiationOptions) {
            rfq.negotiationOptions = new NegotiationOptions();
        }
        if(this.primaryTermsSource == 'product_defaults') {
            rfq.negotiationOptions.deliveryPeriod = this.wrapper.lineDeliveryPeriodString !== this.wrapper.rfqDeliveryPeriodString;
            rfq.negotiationOptions.incoterms = this.wrapper.lineIncoterms !== this.wrapper.rfqIncoterms;
            rfq.negotiationOptions.paymentMeans = this.wrapper.linePaymentMeans !== this.wrapper.rfqPaymentMeans;
            rfq.negotiationOptions.paymentTerms = this.wrapper.linePaymentTerms !== this.wrapper.rfqPaymentTermsToString;
            rfq.negotiationOptions.price = this.wrapper.lineDiscountPriceWrapper.discountedPricePerItem !== this.wrapper.rfqDiscountPriceWrapper.pricePerItem;
            rfq.negotiationOptions.warranty = this.wrapper.lineWarrantyString !== this.wrapper.rfqWarrantyString;
            rfq.negotiationOptions.termsAndConditions = UBLModelUtils.areTermsAndConditionListsDifferent(this.defaultTermsAndConditions, this.wrapper.rfq.termOrCondition);

        } else {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(this.primaryTermsSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }
            rfq.negotiationOptions.deliveryPeriod = quotationWrapper.deliveryPeriodString !== this.wrapper.rfqDeliveryPeriodString;
            rfq.negotiationOptions.incoterms = quotationWrapper.incoterms !== this.wrapper.rfqIncoterms;
            rfq.negotiationOptions.paymentMeans = quotationWrapper.paymentMeans !== this.wrapper.rfqPaymentMeans;
            rfq.negotiationOptions.paymentTerms = quotationWrapper.paymentTermsWrapper.paymentTerm !== this.wrapper.rfqPaymentTermsToString;
            rfq.negotiationOptions.price = quotationWrapper.priceWrapper.pricePerItem !== this.wrapper.rfqDiscountPriceWrapper.discountedPricePerItem;
            rfq.negotiationOptions.warranty = quotationWrapper.warrantyString !== this.wrapper.rfqWarrantyString;
            rfq.negotiationOptions.termsAndConditions = UBLModelUtils.areTermsAndConditionListsDifferent(quotationWrapper.quotation.termOrCondition, this.wrapper.rfq.termOrCondition);
        }
    }

    /*
     * Event handlers
     */

    onSendRequest(): void {
        if (this.wrapper.rfqDiscountPriceWrapper.itemPrice.hasPrice()) {
            if (!isValidPrice(this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount.value)) {
                alert("Price cannot have more than 2 decimal places");
                return;
            }
        }
        if(this.isNegotiatingAnyTerm()) {
            // create an additional trading term for the frame contract duration
            if(this.rfq.negotiationOptions.frameContractDuration && this.isFrameContractValid()) {
                this.wrapper.rfqFrameContractDuration = this.frameContractDuration;
            }

            // final check on the rfq
            const rfq: RequestForQuotation = copy(this.rfq);
            if(this.bpDataService.modifiedCatalogueLines) {
                // still needed when initializing RFQ with BpDataService.initRfqWithIir() or BpDataService.initRfqWithQuotation()
                // but this is a hack, the methods above should be fixed.
                rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
            }
            UBLModelUtils.removeHjidFieldsFromObject(rfq);

            // send request for quotation
            this.callStatus.submit();

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

                const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.buyerId, this.sellerId,this.cookieService.get("user_id"), rfq, this.bpDataService);
                const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                return this.bpeService.startBusinessProcess(piim);

            }).then(() => {
                this.callStatus.callback("Terms sent", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

            }).catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            // set the item price, otherwise we will lose item price information
            this.bpDataService.requestForQuotation.requestForQuotationLine[0].lineItem.price.priceAmount.value = this.wrapper.rfqDiscountPriceWrapper.totalPrice/this.wrapper.rfqDiscountPriceWrapper.orderedQuantity.value;
            // just go to order page
            this.bpDataService.initOrderWithRfq();
            this.bpDataService.proceedNextBpStep("buyer", "Order")
        }
    }

    onUpdateRequest(): void {
        this.callStatus.submit();

        const rfq: RequestForQuotation = copy(this.rfq);
        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processId).then(() => {
            this.documentService.updateCachedDocument(rfq.id,rfq);
            this.callStatus.callback("Terms updated", true);
            var tab = "PUCHASES";
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

    onTermsSourceChange(termSource: 'product_defaults' | 'frame_contract' | 'last_offer', ignoreNegotiationOptions: boolean = false): void {
        this.primaryTermsSource = termSource;

        if(termSource == 'frame_contract' || termSource == 'last_offer') {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(termSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }

            if(!this.rfq.negotiationOptions.deliveryPeriod || ignoreNegotiationOptions) {
                this.wrapper.rfqDeliveryPeriod = copy(quotationWrapper.deliveryPeriod);
            }
            if(!this.rfq.negotiationOptions.warranty || ignoreNegotiationOptions) {
                this.wrapper.rfqWarranty = copy(quotationWrapper.warranty);
            }
            if(!this.rfq.negotiationOptions.paymentTerms || ignoreNegotiationOptions) {
                this.wrapper.rfqPaymentTerms.paymentTerm = quotationWrapper.paymentTermsWrapper.paymentTerm;
            }
            if(!this.rfq.negotiationOptions.incoterms || ignoreNegotiationOptions) {
                this.wrapper.rfqIncoterms = quotationWrapper.incoterms;
            }
            if(!this.rfq.negotiationOptions.paymentMeans || ignoreNegotiationOptions) {
                this.wrapper.rfqPaymentMeans = quotationWrapper.paymentMeans;
            }
            if(!this.rfq.negotiationOptions.price || ignoreNegotiationOptions) {
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = trimRedundantDecimals(quotationWrapper.priceWrapper.pricePerItem);
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = quotationWrapper.priceWrapper.currency;
            }
            if(!this.rfq.negotiationOptions.frameContractDuration || ignoreNegotiationOptions) {
                this.frameContractDuration = copy(quotationWrapper.frameContractDuration);
            }
            if(!this.rfq.negotiationOptions.termsAndConditions || ignoreNegotiationOptions) {
                this.rfq.termOrCondition = copy(quotationWrapper.quotation.termOrCondition);
            }

        } else if(termSource == 'product_defaults') {
            if(!this.rfq.negotiationOptions.deliveryPeriod || ignoreNegotiationOptions) {
                this.wrapper.rfqDeliveryPeriod = copy(this.wrapper.originalLineDeliveryPeriod);
            }
            if(!this.rfq.negotiationOptions.warranty || ignoreNegotiationOptions) {
                this.wrapper.rfqWarranty = copy(this.wrapper.originalLineWarranty);
            }
            if(!this.rfq.negotiationOptions.paymentTerms || ignoreNegotiationOptions) {
                this.wrapper.rfqPaymentTerms.paymentTerm = this.wrapper.linePaymentTerms;
            }
            if(!this.rfq.negotiationOptions.incoterms || ignoreNegotiationOptions) {
                this.wrapper.rfqIncoterms = this.wrapper.originalLineIncoterms;
            }
            if(!this.rfq.negotiationOptions.paymentMeans || ignoreNegotiationOptions) {
                this.wrapper.rfqPaymentMeans = this.wrapper.linePaymentMeans;
            }
            if(!this.rfq.negotiationOptions.price || ignoreNegotiationOptions) {
                this.onPriceConditionsChange();
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = trimRedundantDecimals(this.wrapper.lineDiscountPriceWrapper.pricePerItem);
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = this.wrapper.lineDiscountPriceWrapper.itemPrice.currency;
            }
            if(!this.rfq.negotiationOptions.termsAndConditions || ignoreNegotiationOptions) {
                this.rfq.termOrCondition = copy(this.defaultTermsAndConditions);
            }
        }
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
        if(!this.rfq.negotiationOptions.price && this.primaryTermsSource == 'product_defaults') {
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.discountedPricePerItem;
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
        let termsAndConditionsDiffer: boolean;

        if(this.primaryTermsSource == 'last_offer' || this.primaryTermsSource == 'frame_contract') {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(this.primaryTermsSource == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }

            priceDiffers = this.wrapper.rfqPricePerItemString != quotationWrapper.priceWrapper.itemPrice.pricePerItemString;
            deliveryPeriodDiffers = this.wrapper.rfqDeliveryPeriodString != quotationWrapper.deliveryPeriodString;
            warrantyDiffers = this.wrapper.rfqWarrantyString != quotationWrapper.warrantyString;
            incotermDiffers = this.wrapper.rfqIncoterms != quotationWrapper.incoterms;
            paymentTermDiffers = this.wrapper.rfqPaymentTerms.paymentTerm != quotationWrapper.paymentTermsWrapper.paymentTerm;
            paymentMeansDiffers = this.wrapper.rfqPaymentMeans != quotationWrapper.paymentMeans;
            frameContractDurationDiffers = this.wrapper.rfq.negotiationOptions.frameContractDuration &&
                durationToString(this.frameContractDuration) != quotationWrapper.rfqFrameContractDurationString;
            termsAndConditionsDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(quotationWrapper.quotation.termOrCondition, this.rfq.termOrCondition);

        } else {
            priceDiffers = this.wrapper.rfqPricePerItemString != this.wrapper.lineDiscountPriceWrapper.discountedPricePerItemString;
            deliveryPeriodDiffers = this.wrapper.rfqDeliveryPeriodString != this.wrapper.lineDeliveryPeriodString;
            warrantyDiffers = this.wrapper.rfqWarrantyString != this.wrapper.lineWarrantyString;
            incotermDiffers = this.wrapper.rfqIncoterms != this.wrapper.lineIncoterms;
            paymentTermDiffers = this.wrapper.rfqPaymentTerms.paymentTerm != this.wrapper.linePaymentTerms;
            paymentMeansDiffers = this.wrapper.rfqPaymentMeans != this.wrapper.linePaymentMeans;

            // although the product default terms are selected, the following two conditions are calculated using the rfq itself
            frameContractDurationDiffers = this.wrapper.rfq.negotiationOptions.frameContractDuration &&
                !UBLModelUtils.areQuantitiesEqual(this.frameContractDuration, this.getFrameContractDurationFromRfq(this.wrapper.initialImmutableRfq));
            termsAndConditionsDiffer = UBLModelUtils.areTermsAndConditionListsDifferent(this.wrapper.initialImmutableRfq.termOrCondition, this.rfq.termOrCondition);
        }

        return priceDiffers ||
            deliveryPeriodDiffers ||
            warrantyDiffers ||
            incotermDiffers ||
            paymentTermDiffers ||
            paymentMeansDiffers ||
            frameContractDurationDiffers ||
            this.rfq.dataMonitoringRequested ||
            termsAndConditionsDiffer;
    }

    get lineHasPrice(): boolean {
        return this.wrapper.lineDiscountPriceWrapper.hasPrice();
    }

    get requestedQuantity(): number {
        return this.rfq.requestForQuotationLine[0].lineItem.quantity.value;
    }

    set requestedQuantity(quantity: number) {
        this.rfq.requestForQuotationLine[0].lineItem.quantity.value = quantity;
    }

    get negotiateDeliveryPeriod(): boolean {
        return this.rfq.negotiationOptions.deliveryPeriod;
    }

    set negotiateDeliveryPeriod(negotiate: boolean) {
        this.rfq.negotiationOptions.deliveryPeriod = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiateWarranty(): boolean {
        return this.rfq.negotiationOptions.warranty;
    }

    set negotiateWarranty(negotiate: boolean) {
        this.rfq.negotiationOptions.warranty = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiateIncoterm(): boolean {
        return this.rfq.negotiationOptions.incoterms;
    }

    set negotiateIncoterm(negotiate: boolean) {
        this.rfq.negotiationOptions.incoterms = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiatePaymentTerm(): boolean {
        return this.rfq.negotiationOptions.paymentTerms;
    }

    set negotiatePaymentTerm(negotiate: boolean) {
        this.rfq.negotiationOptions.paymentTerms = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiatePaymentMean(): boolean {
        return this.rfq.negotiationOptions.paymentMeans;
    }

    set negotiatePaymentMean(negotiate: boolean) {
        this.rfq.negotiationOptions.paymentMeans = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiatePrice(): boolean {
        return this.rfq.negotiationOptions.price;
    }

    set negotiatePrice(negotiate: boolean) {
        this.rfq.negotiationOptions.price = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiateFrameContractDuration(): boolean {
        return this.rfq.negotiationOptions.frameContractDuration;
    }

    set negotiateFrameContractDuration(negotiate: boolean) {
        this.rfq.negotiationOptions.frameContractDuration = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get negotiateTermsAndConditions(): boolean {
        return this.rfq.negotiationOptions.termsAndConditions;
    }

    set negotiateTermsAndConditions(negotiate: boolean) {
        this.rfq.negotiationOptions.termsAndConditions = negotiate;
        if(!negotiate) {
            this.onTermsSourceChange(this.primaryTermsSource);
        }
    }

    get selectedAddress(): string {
        return this.selectedAddressValue;
    }

    set selectedAddress(addressStr: string) {
        this.selectedAddressValue = addressStr;

        if(addressStr !== "") {
            const index = Number(addressStr);
            const address = this.bpDataService.getCompanySettings().tradeDetails.deliveryTerms[index].deliveryAddress;
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
        const deliveryTerms = this.bpDataService.getCompanySettings().tradeDetails.deliveryTerms;
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

    isFormValid(): boolean {
        let formValid = !this.rfq.negotiationOptions.frameContractDuration || this.isFrameContractValid();
        formValid = formValid && this.isDeliveryPeriodValid() && this.isWarrantyPeriodValid() && this.isPriceValid();
        return formValid;
    }

    isPriceValid(): boolean {
        return this.wrapper.rfqDiscountPriceWrapper.itemPrice.value > 0;
    }

    isWaitingForReply(): boolean {
        return this.processMetadata && this.processMetadata.processStatus === "Started";
    }

    showRequestedPrice(): boolean {
        return this.isWaitingForReply() && !this.processMetadata.isBeingUpdated;
    }

    isFrameContractValid(): boolean {
        return this.frameContractDuration.value != null && this.frameContractDuration.unitCode != null;
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
        return !this.isReadOnly() && (!this.frameContractAvailable || this.wrapper.rfqFrameContractDuration != null);
    }

    isFrameContractVisible(): boolean {
        return !this.frameContractAvailable || this.wrapper.rfqFrameContractDuration != null;
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

    isFrameContractTermsChanged(): boolean {
        return !UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqDeliveryPeriod, this.wrapper.frameContractQuotationWrapper.deliveryPeriod) ||
            !UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqWarranty, this.wrapper.frameContractQuotationWrapper.warranty) ||
            this.wrapper.rfqPaymentTerms.paymentTerm != this.wrapper.frameContractQuotationWrapper.paymentTermsWrapper.paymentTerm ||
            this.wrapper.rfqIncoterms != this.wrapper.frameContractQuotationWrapper.incoterms ||
            this.wrapper.rfqPaymentMeans != this.wrapper.frameContractQuotationWrapper.paymentMeans ||
            !UBLModelUtils.areAmountsEqual(this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount, this.wrapper.frameContractQuotationWrapper.priceWrapper.price.priceAmount) ||
            !UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.baseQuantity, this.wrapper.frameContractQuotationWrapper.priceWrapper.price.baseQuantity);
    }

    isManufacturersTermsSelectBoxVisible(): boolean {
        return this.manufacturersTermsExistence.frame_contract == true || this.manufacturersTermsExistence.last_offer == true;
    }

    getTermAndConditions(): Clause[] {
        if(this.primaryTermsSource == 'product_defaults') {
            console.log("pd");
            return this.wrapper.initialImmutableRfq.termOrCondition;
        } else if(this.primaryTermsSource == 'frame_contract') {
            console.log("fc");
            return this.wrapper.frameContractQuotation.termOrCondition;
        } else {
            console.log("lo");
            return this.wrapper.lastOfferQuotation.termOrCondition;
        }
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

    private getFrameContractDurationFromRfq(rfq: RequestForQuotation): Quantity {
        let tradingTerm: TradingTerm = rfq.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if(tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.lineDiscountPriceWrapper.appliedDiscounts,this.wrapper.lineDiscountPriceWrapper.price.priceAmount.currencyID);
    }
}
