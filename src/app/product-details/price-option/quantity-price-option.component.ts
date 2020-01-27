import {Component, Input} from "@angular/core";
import {PriceOption} from "../../catalogue/model/publish/price-option";
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
    @Input() readonly:boolean = false;
}
