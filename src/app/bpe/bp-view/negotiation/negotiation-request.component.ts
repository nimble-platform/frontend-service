import { Component, OnInit, Input } from "@angular/core";
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
import { getMaximumQuantityForPrice, getStepForPrice, copy } from "../../../common/utils";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import { PeriodRange } from "../../../user-mgmt/model/period-range";
import { Quantity } from "../../../catalogue/model/publish/quantity";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    line: CatalogueLine;
    rfq: RequestForQuotation;
    rfqLine: RequestForQuotationLine;
    wrapper: NegotiationModelWrapper;

    negotiatedPriceValue: number;
    totalPrice: number;

    callStatus: CallStatus = new CallStatus();

    CURRENCIES: string[] = CURRENCIES;

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
                private cookieService: CookieService,
                private location: Location,
                private router: Router) {

    }

    ngOnInit() {
        this.bpDataService.computeRfqNegotiationOptionsIfNeeded();
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqLine = this.rfq.requestForQuotationLine[0];
        this.line = this.bpDataService.getCatalogueLine();
        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, null, this.bpDataService.getCompanyNegotiationSettings());
        this.totalPrice = this.wrapper.rfqTotalPrice;
        this.negotiatedPriceValue = this.totalPrice;

        if(!this.lineHasPrice) {
            this.rfq.negotiationOptions.price = true;
        }
    }

    /*
     * Event handlers
     */

    onSendRequest(): void {
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

            //first initialize the seller and buyer parties.
            //once they are fetched continue with starting the ordering process
            const sellerId: string = this.line.goodsItem.item.manufacturerParty.id;
            const buyerId: string = this.cookieService.get("company_id");

           Promise.all([
                this.userService.getParty(buyerId),
                this.userService.getParty(sellerId)
            ])
            .then(([buyerParty, sellerParty]) => {
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", buyerId, sellerId, rfq, this.bpDataService);
                const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                return this.bpeService.startBusinessProcess(piim)
            })
            .then(() => {
                this.callStatus.callback("Terms sent", true);
                this.router.navigate(['dashboard']);
            })
            .catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            // just go to order page
            this.bpDataService.initOrderWithRfq();
            this.bpDataService.setBpOptionParameters("buyer", "Order", "Negotiation");
        }
    }

    onBack(): void {
        this.location.back();
    }

    /*
     * Getters and setters for the template.
     */

    isNegotiatingAnyTerm(): boolean {
        return this.rfq.negotiationOptions.price
            || this.rfq.negotiationOptions.deliveryPeriod
            || this.rfq.negotiationOptions.warranty
            || this.rfq.negotiationOptions.incoterms
            || this.rfq.negotiationOptions.paymentTerms
            || this.rfq.negotiationOptions.paymentMeans
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
        return this.rfq.negotiationOptions.price;
    }

    set negotiatePrice(negotiate: boolean) {
        this.rfq.negotiationOptions.price = negotiate;
        if(!negotiate) {
            this.wrapper.rfqPriceWrapper.itemPrice.value = this.wrapper.linePriceWrapper.itemPrice.value;
        }
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
        return !!this.bpDataService.processMetadata;
    }

    isFormValid(): boolean {
        return this.isDeliveryPeriodValid() && this.isWarrantyPeriodValid() && this.isPriceValid();
    }

    isWaitingForReply(): boolean {
        return this.bpDataService.processMetadata && this.bpDataService.processMetadata.processStatus === "Started";
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
}
