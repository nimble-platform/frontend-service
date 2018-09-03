import {DISCOUNT_TARGETS, DISCOUNT_UNITS, PRICE_OPTIONS} from "../../model/constants";
import {Component, Input, OnInit} from "@angular/core";
import {PriceOption} from "../../model/publish/price-option";
import {AllowanceCharge} from "../../model/publish/allowance-charge";
import {Amount} from "../../model/publish/amount";
/**
 * Created by suat on 28-Aug-18.
 */
@Component({
    selector: "quantity-price-option",
    templateUrl: "./quantity-price-option.component.html"
})
export class QuantityPriceOptionComponent implements OnInit {

    @Input() priceOption: PriceOption;
    @Input() index: number;

    selectedDiscountTarget: string = DISCOUNT_TARGETS.TOTAL_PRICE;
    amount: Amount;

    discountTargets = DISCOUNT_TARGETS;
    discountUnits = DISCOUNT_UNITS;
    object = Object;

    ngOnInit() {
        // if the discount target is already set, we should set the selected discount target properly
        if(this.priceOption.itemLocationQuantity.allowanceCharge.perUnitAmount == null) {
            this.selectedDiscountTarget = DISCOUNT_TARGETS.TOTAL_PRICE;
            this.amount = this.priceOption.itemLocationQuantity.allowanceCharge.amount;

        } else if(this.priceOption.itemLocationQuantity.allowanceCharge.amount == null) {
            this.selectedDiscountTarget = DISCOUNT_TARGETS.PER_UNIT;
            this.amount = this.priceOption.itemLocationQuantity.allowanceCharge.perUnitAmount;

        } else {
            this.amount = this.priceOption.itemLocationQuantity.allowanceCharge.amount;
        }
    }

    changeDiscountTarget(discountTarget: string, allowanceCharge: AllowanceCharge): void {
        if(discountTarget == DISCOUNT_TARGETS.PER_UNIT) {
            if(allowanceCharge.amount != null) {
                allowanceCharge.perUnitAmount = allowanceCharge.amount;
                allowanceCharge.amount = null;
                this.amount = allowanceCharge.perUnitAmount;
            }

        } else {
            if(allowanceCharge.perUnitAmount != null) {
                allowanceCharge.amount = allowanceCharge.perUnitAmount;
                allowanceCharge.perUnitAmount = null;
                this.amount = allowanceCharge.amount;
            }
        }
    }
}
