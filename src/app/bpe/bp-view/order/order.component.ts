import { Component, OnInit } from "@angular/core";
import { Order } from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";
import { BPDataService } from "../bp-data-service";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import { Location } from "@angular/common";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { Router } from "@angular/router";
import { copy, quantityToString } from "../../../common/utils";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { UserService } from "../../../user-mgmt/user.service";
import { CookieService } from "ng2-cookies";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { BPEService } from "../../bpe.service";
import { BpUserRole } from "../../model/bp-user-role";
import { OrderResponseSimple } from "../../../catalogue/model/publish/order-response-simple";
import { PriceWrapper } from "../price-wrapper";
import { Price } from "../../../catalogue/model/publish/price";

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "order",
    templateUrl: "./order.component.html",
    styleUrls: ["./order.component.css"]
})
export class OrderComponent implements OnInit {
    
    order: Order;
    orderResponse: OrderResponseSimple;
    paymentTermsWrapper: PaymentTermsWrapper;
    priceWrapper: PriceWrapper;
    userRole: BpUserRole;

    showPreview: boolean = false;

    callStatus: CallStatus = new CallStatus();

    constructor(private bpDataService: BPDataService,
                private userService: UserService,
                private bpeService: BPEService,
                private cookieService: CookieService,
                private location: Location,
                private router: Router) {

    }

    ngOnInit(): void {
        if(this.bpDataService.order == null) {
            this.router.navigate(['dashboard']);
        }
        this.order = this.bpDataService.order;
        this.paymentTermsWrapper = new PaymentTermsWrapper(this.order.paymentTerms);
        this.userRole = this.bpDataService.userRole;
        this.orderResponse = this.bpDataService.orderResponse;
        this.priceWrapper = new PriceWrapper(
            this.order.orderLine[0].lineItem.price,
            this.order.orderLine[0].lineItem.quantity
        );
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return this.bpDataService.processMetadata && this.bpDataService.processMetadata.processStatus === "Completed";
    }

    getQuantityText(): string {
        return quantityToString(this.order.orderLine[0].lineItem.quantity);
    }

    getTotalPriceText(): string {
        return this.priceWrapper.totalPriceString;
    }

    getDeliveryPeriodText(): string {
        const qty = this.getLineItem().delivery[0].requestedDeliveryPeriod.durationMeasure;
        return `${qty.value} ${qty.unitCode}`;
    }

    getWarrantyPeriodText(): string {
        const warranty = this.getLineItem().warrantyValidityPeriod.durationMeasure;
        if(!warranty || !warranty.unitCode || !warranty.value) {
            return "None";
        }
        return `${warranty.value} ${warranty.unitCode}`;
    }

    getIncoterm(): string {
        return this.getLineItem().deliveryTerms.incoterms;
    }

    getPaymentMeans(): string {
        return this.order.paymentMeans.paymentMeansCode.name;
    }

    getLineItem(): LineItem {
        return this.order.orderLine[0].lineItem;
    }

    onBack() {
        this.location.back();
    }

    onOrder() {
        this.callStatus.submit();
        let order = copy(this.bpDataService.order);

        // final check on the order
        order.orderLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(order);
        order.anticipatedMonetaryTotal.payableAmount.value = this.priceWrapper.totalPrice;
        order.anticipatedMonetaryTotal.payableAmount.currencyID = this.priceWrapper.currency;
    
        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId: string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        let buyerId: string = this.cookieService.get("company_id");
        this.userService.getParty(buyerId).then(buyerParty => {
            order.buyerCustomerParty = new CustomerParty(buyerParty);

            this.userService.getParty(sellerId).then(sellerParty => {
                order.sellerSupplierParty = new SupplierParty(sellerParty);

                let vars:ProcessVariables = ModelUtils.createProcessVariables("Order", buyerId, sellerId, order, this.bpDataService);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.callStatus.callback("Order placed", true);
                        this.router.navigate(['dashboard']);
                    }).catch(error => {
                        this.callStatus.error("Failed to send Order");
                        console.log("Error while sending order", error)
                    });
            });
        });
    }

    onAcceptOrder() {

    }

    onRejectOrder() {
        
    }
}
