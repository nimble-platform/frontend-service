import {Component, Input, OnInit} from "@angular/core";
import {PriceOption} from "../../catalogue/model/publish/price-option";
import {CatalogueLine} from '../../catalogue/model/publish/catalogue-line';
import {EmptyFormBase} from '../../common/validation/empty-form-base';
/**
 * Created by suat on 28-Aug-18.
 */

const QUANTITY_PRICE_OPTION_FORM_CONTROL_NAME = 'quantityPriceOptionControl';

@Component({
    selector: "quantity-price-option",
    templateUrl: "./quantity-price-option.component.html"
})
export class QuantityPriceOptionComponent extends EmptyFormBase implements OnInit {
    @Input() catalogueLine: CatalogueLine;
    @Input() priceOption: PriceOption;
    @Input() discountUnits;
    @Input() readonly:boolean = false;
    discountStep: number;

    ngOnInit() {
        this.discountStep = this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value;

        // initialize form controls
        this.addViewFormToParentForm(QUANTITY_PRICE_OPTION_FORM_CONTROL_NAME);
    }
}
