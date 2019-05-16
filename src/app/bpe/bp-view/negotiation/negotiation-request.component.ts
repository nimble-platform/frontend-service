import {Component, OnInit, ViewChild} from "@angular/core";
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
import {ActivatedRoute, Router} from "@angular/router";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {NegotiationModelWrapper} from "./negotiation-model-wrapper";
import {copy, getMaximumQuantityForPrice, getStepForPrice, isValidPrice} from "../../../common/utils";
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
import {NegotiationOptions} from "../../../catalogue/model/publish/negotiation-options";
import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
import {ActivityVariableParser} from "../activity-variable-parser";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    CURRENCIES: string[] = CURRENCIES;

    catalogueLine: CatalogueLine;
    rfq: RequestForQuotation;
    rfqLine: RequestForQuotationLine;
    wrapper: NegotiationModelWrapper;
    frameContract: DigitalAgreement = new DigitalAgreement();
    frameContractDuration: Quantity = new Quantity();
    initialFrameContractDuration: Quantity = new Quantity(); // keeps the initial frame contract duration to be able to compare the latest value with the initial one
    frameContractDurationUnits: string[];
    termsDropdownValue: 'product_defaults' | 'frame_contract' | 'last_offer' = 'product_defaults';
    manufacturersTermsExistence: any = {'product_defaults': true};
    sellerId:string = null;
    buyerId:string = null;
    totalPrice: number;
    selectedAddressValue = "";
    config = myGlobals.config;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata = null;
    processMetadataHistory: ThreadEventMetadata[];

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

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
    callStatus: CallStatus = new CallStatus();
    pageInitCallStatus: CallStatus = new CallStatus();

    /**
     * URL parameters
     */
    termsSource: 'product_defaults' | 'frame_contract' | 'last_offer' = 'product_defaults';

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
                private unitService: UnitService,
                private cookieService: CookieService,
                private location: Location,
                private documentService: DocumentService,
                private router: Router,
                private route: ActivatedRoute) {

    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.termsSource = params["termsSource"];
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

        let frameContractDuration = this.getFrameContractDurationFromRfq();
        // if the rfq frame contract duration is not null, we are rendering the negotiation process in which the frame contract duration is also negotiated
        let frameContractPromise: Promise<DigitalAgreement> = Promise.resolve(null);
        if(frameContractDuration != null) {
            this.frameContractDuration = frameContractDuration
            this.initialFrameContractDuration = copy(this.frameContractDuration);

            // check whether there is an existing frame contract created in another negotiation process
        } else {
            frameContractPromise = this.bpeService.getFrameContract(
                UBLModelUtils.getPartyId(this.catalogueLine.goodsItem.item.manufacturerParty),
                this.cookieService.get("company_id"),
                this.rfq.requestForQuotationLine[0].lineItem.item.manufacturersItemIdentification.id);
        }

        // execute the promises and initialize wrapper
        // first check the existence a frame contract
        this.pageInitCallStatus.submit();
        this.getDocuments(frameContractPromise).then(response => {
            let frameContract = response.frameContract;
            let lastOfferQuotation = response.lastOfferQuotation;
            let frameContractQuotation = response.frameContractQuotation;

            // construct wrapper with the retrieved documents
            this.wrapper = new NegotiationModelWrapper(
                this.catalogueLine,
                this.rfq,
                null,
                frameContractQuotation,
                lastOfferQuotation,
                this.bpDataService.getCompanySettings().negotiationSettings);

            // initialize frame contract variables
            if(frameContract) {
                this.frameContract = response.frameContract;
                this.frameContractAvailable = true;
                this.frameContractDuration = this.frameContract.digitalAgreementTerms.validityPeriod.durationMeasure;
                this.manufacturersTermsExistence.frame_contract = true;
            }

            // terms select box value should be set before computing the negotiation options
            if (this.manufacturersTermsExistence.last_offer) {
                this.termsDropdownValue = 'last_offer';
            } else if(this.manufacturersTermsExistence.frame_contract) {
                this.termsDropdownValue = 'frame_contract';
            }

            // if a new business process is created load initial terms based on the selected terms source
            if(!this.processMetadata) {
                this.loadTerms(this.termsDropdownValue, true);
            }

            // compute negotiation options for selecting the negotiation ticks automatically
            this.computeRfqNegotiationOptions(this.rfq);
            // if the line does not have a price enable the price negotiation
            if(!this.lineHasPrice) {
                this.rfq.negotiationOptions.price = true;
            }

            // load the terms based on the availability of the terms
            this.loadTerms(this.termsDropdownValue);

            // update the price based on the updated conditions
            this.onPriceConditionsChange();

            // set the flag for showing the counter terms if the presen
            if(this.processMetadata != null) {
                this.showCounterOfferTerms = true;
            }

            this.pageInitCallStatus.callback(null, true);
        });

        // get frame contract units
        this.unitService.getCachedUnitList(frameContractDurationUnitListId).then(list => {
           this.frameContractDurationUnits = list;
        });
    }

    private async getDocuments(frameContractPromise: Promise<DigitalAgreement>): Promise<any> {
        let response = {};
        let frameContract = null;
        try {
            frameContract = await frameContractPromise;
        } catch(e) {
            // do nothing
        }
        let responseDocument: Promise<any> = Promise.resolve(null);
        if(this.manufacturersTermsExistence.last_offer) {
            responseDocument = this.documentService.getResponseDocument(this.processMetadataHistory[0].activityVariables);
        }

        let frameContractQuotation: Promise<any> = Promise.resolve(null);
        if(frameContract != null) {
            response['frameContract'] = frameContract;

            // load the quotation associated to the frame contract
            frameContractQuotation = this.documentService.getDocumentJsonContent(frameContract.quotationReference.id);
        }

        // retrieve the corresponding documents for the frame contract and last offer
        response['lastOfferQuotation'] = await responseDocument;
        response['frameContractQuotation'] = await frameContractQuotation;

        return Promise.resolve(response);
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
        if(this.termsDropdownValue == 'product_defaults') {
            rfq.negotiationOptions.deliveryPeriod = this.wrapper.lineDeliveryPeriodString !== this.wrapper.rfqDeliveryPeriodString;
            rfq.negotiationOptions.incoterms = this.wrapper.lineIncoterms !== this.wrapper.rfqIncoterms;
            rfq.negotiationOptions.paymentMeans = this.wrapper.linePaymentMeans !== this.wrapper.rfqPaymentMeans;
            rfq.negotiationOptions.paymentTerms = this.wrapper.linePaymentTerms !== this.wrapper.rfqPaymentTermsToString;
            rfq.negotiationOptions.price = this.wrapper.lineDiscountPriceWrapper.pricePerItem !== this.wrapper.rfqDiscountPriceWrapper.itemPrice.value;
            rfq.negotiationOptions.warranty = this.wrapper.lineWarrantyString !== this.wrapper.rfqWarrantyString;

        } else {
            let quotationWrapper = this.wrapper.frameContractQuotationWrapper;
            if(this.termsDropdownValue == 'last_offer') {
                quotationWrapper = this.wrapper.lastOfferQuotationWrapper;
            }
            rfq.negotiationOptions.deliveryPeriod = quotationWrapper.deliveryPeriodString !== this.wrapper.rfqDeliveryPeriodString;
            rfq.negotiationOptions.incoterms = quotationWrapper.incoterms !== this.wrapper.rfqIncoterms;
            rfq.negotiationOptions.paymentMeans = quotationWrapper.paymentMeans !== this.wrapper.rfqPaymentMeans;
            rfq.negotiationOptions.paymentTerms = quotationWrapper.paymentTermsWrapper.paymentTerm !== this.wrapper.rfqPaymentTermsToString;
            rfq.negotiationOptions.price = quotationWrapper.priceWrapper.pricePerItem !== this.wrapper.rfqDiscountPriceWrapper.itemPrice.value;
            rfq.negotiationOptions.warranty = quotationWrapper.warrantyString !== this.wrapper.rfqWarrantyString;
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

    loadTerms(termSource: 'product_defaults' | 'frame_contract' | 'last_offer', ignoreNegotiationOptions: boolean = false): void {
        this.termsDropdownValue = termSource;

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
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = quotationWrapper.priceWrapper.pricePerItem;
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = quotationWrapper.priceWrapper.currency;
            }
            this.rfq.termOrCondition = copy(quotationWrapper.quotation.termOrCondition);

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
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.itemPrice.value;
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = this.wrapper.lineDiscountPriceWrapper.itemPrice.currency;
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
        this.wrapper.lineDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.pricePerItem;

        // update the rfq price only if the price is not being negotiated and the default product terms are presented
        // it does not make sense to update price based on the discounts when the terms of frame contract or last offer terms are presented
        if(!this.rfq.negotiationOptions.price && this.termsDropdownValue == 'product_defaults') {
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.pricePerItem;
        }
    }

    /*
     * Getters and setters for the template.
     */

    isNegotiatingAnyTerm(): boolean {
        return this.rfq.negotiationOptions.price
            || this.rfq.negotiationOptions.deliveryPeriod
            || this.rfq.negotiationOptions.warranty
            || (this.rfq.negotiationOptions.incoterms /*&& this.wrapper.lineIncoterms != this.wrapper.rfqIncoterms*/)
            || (this.rfq.negotiationOptions.paymentTerms /*&& this.wrapper.linePaymentTerms != this.wrapper.rfqPaymentTerms.paymentTerm*/)
            || (this.rfq.negotiationOptions.paymentMeans /*&& this.wrapper.linePaymentMeans != this.wrapper.rfqPaymentMeans*/)
            || this.rfq.dataMonitoringRequested
            || (this.rfq.negotiationOptions.frameContractDuration /*&& !UBLModelUtils.areQuantitiesEqual(this.initialFrameContractDuration, this.wrapper.rfqFrameContractDuration)*/);
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

    get negotiatePrice(): boolean {
        return this.rfq.negotiationOptions.price;
    }

    set negotiatePrice(negotiate: boolean) {
        this.rfq.negotiationOptions.price = negotiate;
        if(!negotiate) {
            if(this.termsDropdownValue == 'product_defaults') {
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.itemPrice.value;
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = this.wrapper.lineDiscountPriceWrapper.itemPrice.currency;

            } else if(this.termsDropdownValue == 'frame_contract') {
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.frameContractQuotationWrapper.priceWrapper.pricePerItem;
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = this.wrapper.frameContractQuotationWrapper.priceWrapper.currency;

            } else {
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lastOfferQuotationWrapper.priceWrapper.pricePerItem;
                this.wrapper.rfqDiscountPriceWrapper.itemPrice.currency = this.wrapper.lastOfferQuotationWrapper.priceWrapper.currency;
            }
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
        return !this.isReadOnly() || this.frameContractAvailable || this.wrapper.rfqFrameContractDuration != null;
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

    private getFrameContractDurationFromRfq(): Quantity {
        let tradingTerm: TradingTerm = this.rfq.tradingTerms.find(tradingTerm => tradingTerm.id == "FRAME_CONTRACT_DURATION");
        if(tradingTerm != null) {
            return tradingTerm.value.valueQuantity[0];
        }
        return null;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.lineDiscountPriceWrapper.appliedDiscounts,this.wrapper.lineDiscountPriceWrapper.price.priceAmount.currencyID);
    }
}
