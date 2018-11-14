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
export class QuantityPriceOptionComponent {
    @Input() priceOption: PriceOption;
    @Input() discountUnits;
}
