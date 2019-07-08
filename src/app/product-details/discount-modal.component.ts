import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {PriceOption} from '../catalogue/model/publish/price-option';
import { PRICE_OPTIONS } from '../catalogue/model/constants';
import {roundToTwoDecimals, selectPreferredValues} from '../common/utils';
import {DiscountPriceWrapper} from "../common/discount-price-wrapper";

@Component({
    selector: "discount-modal",
    templateUrl: "./discount-modal.component.html",
    styleUrls: ['./discount-modal.component.css']
})
export class DiscountModalComponent implements OnInit {

    @ViewChild("modal") modal: ElementRef;

    orderedQuantityDiscounts:PriceOption[] = [];
    productPropertyDiscounts:PriceOption[] = [];
    deliveryPeriodDiscounts:PriceOption[] = [];
    incotermDiscounts:PriceOption[] = [];
    paymentMeanDiscounts:PriceOption[] = [];
    deliveryLocationDiscount:PriceOption[] = [];

    PRICE_OPTIONS = PRICE_OPTIONS;
    currencyId = null;
    totalDiscount = null;

    constructor(private modalService: NgbModal) {
    }

    ngOnInit() {

    }

    getPropertyName = selectPreferredValues;

    open(priceWrapper: DiscountPriceWrapper) {
        let appliedDiscounts = priceWrapper.appliedDiscounts;
        this.currencyId = priceWrapper.currency;

        this.resetDiscounts();
        for(let discount of appliedDiscounts){
            switch (discount.typeID){
                case PRICE_OPTIONS.ORDERED_QUANTITY.typeID:
                    this.orderedQuantityDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.DELIVERY_LOCATION.typeID:
                    this.deliveryLocationDiscount.push(discount);
                    break;
                case PRICE_OPTIONS.PRODUCT_PROPERTY.typeID:
                    this.productPropertyDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.DELIVERY_PERIOD.typeID:
                    this.deliveryPeriodDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.INCOTERM.typeID:
                    this.incotermDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.PAYMENT_MEAN.typeID:
                    this.paymentMeanDiscounts.push(discount);
                    break;
            }
        }
        this.totalDiscount = priceWrapper.calculateTotalDiscount();

        this.modalService.open(this.modal).result.then((result) => {

        }, () => {

        });

    }

    private resetDiscounts():void{
        this.orderedQuantityDiscounts = [];
        this.deliveryLocationDiscount = [];
        this.productPropertyDiscounts = [];
        this.deliveryPeriodDiscounts = [];
        this.incotermDiscounts = [];
        this.paymentMeanDiscounts = [];
    }

    private getAbsValue(value:number):number{
        return roundToTwoDecimals(Math.abs(value));
    }
}