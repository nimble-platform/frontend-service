import {Component, OnInit, Input, ViewChild} from '@angular/core';
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "../bp-data-service";
import { CURRENCIES } from "../../../catalogue/model/constants";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { RequestForQuotationLine } from "../../../catalogue/model/publish/request-for-quotation-line";
import { Location } from "@angular/common";
import { CallStatus } from "../../../common/call-status";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { BPEService } from "../../bpe.service";
import { UserService } from "../../../user-mgmt/user.service";
import { CookieService } from "ng2-cookies";
import { Router } from "@angular/router";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { NegotiationModelWrapper } from "./negotiation-model-wrapper";
import {getMaximumQuantityForPrice, getStepForPrice, copy, isValidPrice} from "../../../common/utils";
import { PeriodRange } from "../../../user-mgmt/model/period-range";
import { Option } from "../../../common/options-input.component";
import { addressToString } from "../../../user-mgmt/utils";
import {DocumentService} from '../document-service';
import {DiscountModalComponent} from '../../../product-details/discount-modal.component';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import * as myGlobals from '../../../globals';
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import {UnitService} from "../../../common/unit-service";
import {frameContractDurationUnitListId} from "../../../common/constants";
import {Party} from "../../../catalogue/model/publish/party";
import {TradingTerm} from "../../../catalogue/model/publish/trading-term";
import {MultiTypeValue} from "../../../catalogue/model/publish/multi-type-value";
import {Quantity} from "../../../catalogue/model/publish/quantity";
import {Quotation} from "../../../catalogue/model/publish/quotation";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    CURRENCIES: string[] = CURRENCIES;

    line: CatalogueLine;
    rfq: RequestForQuotation;
    rfqLine: RequestForQuotationLine;
    wrapper: NegotiationModelWrapper;
    frameContract: DigitalAgreement = new DigitalAgreement();
    frameContractDuration: Quantity = new Quantity();
    initialFrameContractDuration: Quantity = new Quantity(); // to be able to compare the latest value with the initial one
    frameContractDurationUnits: string[];
    config = myGlobals.config;

    negotiatedPriceValue: number;
    totalPrice: number;

    selectedAddressValue = "";

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

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
    callStatus: CallStatus = new CallStatus();

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
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;
        this.bpDataService.computeRfqNegotiationOptionsIfNeeded();
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqLine = this.rfq.requestForQuotationLine[0];
        this.line = this.bpDataService.getCatalogueLine();
        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, null, this.bpDataService.getCompanySettings().negotiationSettings);
        this.totalPrice = this.wrapper.rfqTotalPrice;
        this.negotiatedPriceValue = this.totalPrice;

        if(!this.lineHasPrice) {
            this.rfq.negotiationOptions.price = true;
        }

        // if the rfq frame contract duration is not null, we are rendering the negotiation process in which the frame contract duration is also negotiated
        if(this.wrapper.rfqFrameContractDuration != null) {
            this.frameContractDuration = this.wrapper.rfqFrameContractDuration;
            this.initialFrameContractDuration = copy(this.frameContractDuration);

        } else {
            // check whether there is an existing frame contract created in another negotiation process
            this.bpeService.getDigitalAgreement(UBLModelUtils.getPartyId(this.line.goodsItem.item.manufacturerParty),
                this.cookieService.get("company_id"),
                this.rfq.requestForQuotationLine[0].lineItem.item.manufacturersItemIdentification.id).then(digitalAgreement => {
                this.frameContract = digitalAgreement;
                this.frameContractAvailable = true;
                this.frameContractDuration = this.frameContract.digitalAgreementTerms.validityPeriod.durationMeasure;
            });
        }

        // get frame contract units
        this.unitService.getCachedUnitList(frameContractDurationUnitListId).then(list => {
           this.frameContractDurationUnits = list;
        });

        // set the flag for showing the counter terms
        if(!this.processMetadata.isBeingUpdated) {
            this.showCounterOfferTerms = true;
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

            //first initialize the seller and buyer parties.
            //once they are fetched continue with starting the ordering process
            const sellerId: string = UBLModelUtils.getPartyId(this.line.goodsItem.item.manufacturerParty);
            const buyerId: string = this.cookieService.get("company_id");

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
                this.userService.getParty(buyerId),
                this.userService.getParty(sellerId),

            ]).then(([buyerPartyResp, sellerPartyResp]) => {
                sellerParty = sellerPartyResp;
                buyerParty = buyerPartyResp;
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", buyerId, sellerId, this.cookieService.get("user_id"), rfq, this.bpDataService);
                const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                return this.bpeService.startBusinessProcess(piim);

            }).then(() => {
                this.callStatus.callback("Terms sent", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

            }).catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            // set the item price, otherwise we will lose item price information
            this.bpDataService.requestForQuotation.requestForQuotationLine[0].lineItem.price.priceAmount.value = this.wrapper.rfqDiscountPriceWrapper.totalPrice/this.wrapper.rfqDiscountPriceWrapper.quantity.value;
            // just go to order page
            this.bpDataService.initOrderWithRfq();
            this.bpDataService.proceedNextBpStep("buyer", "Order")
        }
    }

    onUpdateRequest(): void {
        this.callStatus.submit();

        const rfq: RequestForQuotation = copy(this.rfq);
        // this.bpeService.updateFrameContract(this.frameContract),
        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processId).then(() => {
            this.documentService.updateCachedDocument(rfq.id,rfq);
            this.callStatus.callback("Terms updated", true);
            var tab = "PUCHASES";
            if (this.bpDataService.bpStartEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        }).catch(error => {
            this.callStatus.error("Failed to update Terms", error);
        });
    }

    onBack(): void {
        this.location.back();
    }

    onOrderQuantityChange(event:any): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    onloadFrameContractTerms(): void {
        // load the quotation associated to the frame contract
        this.documentService.getDocumentJsonContent(this.frameContract.quotationReference.id).then(document => {
            let quotation: Quotation = document;
            let quotationWrapper: NegotiationModelWrapper = new NegotiationModelWrapper(null, this.rfq, quotation, null);
            this.wrapper.rfqDeliveryPeriod = quotationWrapper.quotationDeliveryPeriod;
            this.rfq.negotiationOptions.deliveryPeriod = true;
            this.wrapper.rfqWarranty = quotationWrapper.quotationWarranty;
            this.rfq.negotiationOptions.warranty = true;
            this.wrapper.rfqPaymentTerms.paymentTerm = quotationWrapper.quotationPaymentTerms.paymentTerm;
            this.rfq.negotiationOptions.paymentTerms = true;
            this.wrapper.rfqIncoterms = quotationWrapper.quotationIncoterms;
            this.rfq.negotiationOptions.incoterms = true;
            this.wrapper.rfqPaymentMeans = quotationWrapper.quotationPaymentMeans;
            this.rfq.negotiationOptions.paymentMeans = true;
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount = quotationWrapper.quotationPriceWrapper.price.priceAmount;
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.baseQuantity = quotationWrapper.quotationPriceWrapper.price.baseQuantity;
            this.rfq.negotiationOptions.price = true;
        });
    }

    /*
     * Getters and setters for the template.
     */

    isNegotiatingAnyTerm(): boolean {
        return this.rfq.negotiationOptions.price
            || this.rfq.negotiationOptions.deliveryPeriod
            || this.rfq.negotiationOptions.warranty
            || (this.rfq.negotiationOptions.incoterms && this.wrapper.lineIncoterms != this.wrapper.rfqIncoterms)
            || (this.rfq.negotiationOptions.paymentTerms && this.wrapper.linePaymentTerms != this.wrapper.rfqPaymentTerms.paymentTerm)
            || (this.rfq.negotiationOptions.paymentMeans && this.wrapper.linePaymentMeans != this.wrapper.rfqPaymentMeans)
            || this.rfq.dataMonitoringRequested
            || (this.rfq.negotiationOptions.frameContractDuration && !UBLModelUtils.areQuantitiesEqual(this.initialFrameContractDuration, this.wrapper.rfqFrameContractDuration));
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
        this.setRemoveDiscountAmount(this.rfq.negotiationOptions.price);
        return this.rfq.negotiationOptions.price;
    }

    set negotiatePrice(negotiate: boolean) {
        this.setRemoveDiscountAmount(negotiate);
        this.rfq.negotiationOptions.price = negotiate;
        if(!negotiate) {
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.value = this.wrapper.lineDiscountPriceWrapper.itemPrice.value;
        }
    }

    // it is used to set wrappers' removeDiscountAmount field while negotiating price
    private setRemoveDiscountAmount(negotiate: boolean){
        // if they negotiate price, then set removeDiscountAmount to false so that prices for wrappers will not be affected by total discount
        if(negotiate){
            this.wrapper.lineDiscountPriceWrapper.removeDiscountAmount = false;
            this.wrapper.rfqDiscountPriceWrapper.removeDiscountAmount = false;
        }
        else {
            this.wrapper.lineDiscountPriceWrapper.removeDiscountAmount = true;
            this.wrapper.rfqDiscountPriceWrapper.removeDiscountAmount = true;

            this.wrapper.lineDiscountPriceWrapper.itemPrice.price.priceAmount.value =this.line.requiredItemLocationQuantity.price.priceAmount.value;
            this.wrapper.lineDiscountPriceWrapper.itemPrice.price.priceAmount.currencyID = this.line.requiredItemLocationQuantity.price.priceAmount.currencyID;

            this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount.value = this.line.requiredItemLocationQuantity.price.priceAmount.value;
            this.wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount.currencyID = this.line.requiredItemLocationQuantity.price.priceAmount.currencyID;
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
        return getStepForPrice(this.line.requiredItemLocationQuantity.price);
    }

    getMaximumQuantity(): number {
        return getMaximumQuantityForPrice(this.line.requiredItemLocationQuantity.price);
    }

    getQuantityUnit(): string {
        if(!this.line) {
            return "";
        }
        return this.line.requiredItemLocationQuantity.price.baseQuantity.unitCode || "";
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    isFormValid(): boolean {
        let formValid = this.rfq.negotiationOptions.frameContractDuration || this.isFrameContractValid();
        formValid = formValid && this.isDeliveryPeriodValid() && this.isWarrantyPeriodValid() && this.isPriceValid();
        return formValid;
    }

    isPriceValid(): boolean {
        return this.wrapper.rfqDiscountPriceWrapper.value > 0;
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

    private getDeliveryPeriodRange(): PeriodRange | null {
        const unit = this.wrapper.rfqDeliveryPeriod.unitCode;
        const settings = this.wrapper.settings;

        const index = settings.deliveryPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.deliveryPeriodRanges[index] : null;
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

    private rfqContainsDigitalAgreementReference(): boolean {
        return this.rfq.additionalDocumentReference.filter(ref => ref.documentType == 'DIGITAL_AGREEMENT').length > 0;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.lineDiscountPriceWrapper.appliedDiscounts,this.wrapper.lineDiscountPriceWrapper.price.priceAmount.currencyID);
    }
}
