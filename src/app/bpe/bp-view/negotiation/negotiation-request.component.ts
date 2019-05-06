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
    showRestOfNegotiationDetails: boolean = false;
    showNotesAndAdditionalFiles: boolean = false;
    showDataMonitoring: boolean = false;
    showDeliveryAddress: boolean = false;
    callStatus: CallStatus = new CallStatus();

    sellerId:string = null;
    buyerId:string = null;

    showPurchaseOrder:boolean = false;

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
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

        this.sellerId = UBLModelUtils.getPartyId(this.line.goodsItem.item.manufacturerParty);
        this.buyerId = this.cookieService.get("company_id");
    }

    /*
     * Event handlers
     */

    onSendRequest(): void {
        if (this.wrapper.rfqPriceWrapper.itemPrice.hasPrice()) {
            if (!isValidPrice(this.wrapper.rfqPriceWrapper.itemPrice.price.priceAmount.value)) {
                alert("Price cannot have more than 2 decimal places");
                return;
            }
        }
        if(this.isNegotiatingAnyTerm()) {
            // send request for quotation
            this.callStatus.submit();
            const rfq: RequestForQuotation = copy(this.rfq);

            // final check on the rfq
            if(this.bpDataService.modifiedCatalogueLines) {
                // still needed when initializing RFQ with BpDataService.initRfqWithIir() or BpDataService.initRfqWithQuotation()
                // but this is a hack, the methods above should be fixed.
                rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
            }
            UBLModelUtils.removeHjidFieldsFromObject(rfq);

           Promise.all([
                this.userService.getParty(this.buyerId),
                this.userService.getParty(this.sellerId)
            ])
            .then(([buyerParty, sellerParty]) => {
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.buyerId, this.sellerId,this.cookieService.get("user_id"), rfq, this.bpDataService);
                const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                return this.bpeService.startBusinessProcess(piim);
            })
            .then(() => {
                this.callStatus.callback("Terms sent", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            // set the item price, otherwise we will lose item price information
            this.bpDataService.requestForQuotation.requestForQuotationLine[0].lineItem.price.priceAmount.value = this.wrapper.rfqPriceWrapper.totalPrice/this.wrapper.rfqPriceWrapper.quantity.value;
            // just go to order page
            this.bpDataService.initOrderWithRfq();
            this.bpDataService.proceedNextBpStep("buyer", "Order")
        }
    }

    onUpdateRequest(): void {
        this.callStatus.submit();
        const rfq: RequestForQuotation = copy(this.rfq);

        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processId)
            .then(() => {
                this.documentService.updateCachedDocument(rfq.id,rfq);
                this.callStatus.callback("Terms updated", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
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

    onOfferCounterTerms(): void {
        this.showCounterOfferTerms = !this.showCounterOfferTerms;
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
            || this.rfq.dataMonitoringRequested;
    }

    get lineHasPrice(): boolean {
        return this.wrapper.linePriceWrapper.hasPrice();
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
            this.wrapper.rfqPriceWrapper.itemPrice.value = this.wrapper.linePriceWrapper.itemPrice.value;
        }
    }

    // it is used to set wrappers' removeDiscountAmount field while negotiating price
    private setRemoveDiscountAmount(negotiate: boolean){
        // if they negotiate price, then set removeDiscountAmount to false so that prices for wrappers will not be affected by total discount
        if(negotiate){
            this.wrapper.linePriceWrapper.removeDiscountAmount = false;
            this.wrapper.rfqPriceWrapper.removeDiscountAmount = false;
        }
        else {
            this.wrapper.linePriceWrapper.removeDiscountAmount = true;
            this.wrapper.rfqPriceWrapper.removeDiscountAmount = true;

            this.wrapper.linePriceWrapper.itemPrice.price.priceAmount.value =this.line.requiredItemLocationQuantity.price.priceAmount.value;
            this.wrapper.linePriceWrapper.itemPrice.price.priceAmount.currencyID = this.line.requiredItemLocationQuantity.price.priceAmount.currencyID;

            this.wrapper.rfqPriceWrapper.itemPrice.price.priceAmount.value = this.line.requiredItemLocationQuantity.price.priceAmount.value;
            this.wrapper.rfqPriceWrapper.itemPrice.price.priceAmount.currencyID = this.line.requiredItemLocationQuantity.price.priceAmount.currencyID;
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
        return this.isDeliveryPeriodValid() && this.isWarrantyPeriodValid() && this.isPriceValid();
    }

    isWaitingForReply(): boolean {
        return this.processMetadata && !this.processMetadata.isBeingUpdated && this.processMetadata.processStatus === "Started";
    }

    isPriceValid(): boolean {
        return this.wrapper.rfqPriceWrapper.value > 0;
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

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.linePriceWrapper.appliedDiscounts,this.wrapper.linePriceWrapper.price.priceAmount.currencyID);
    }
}
