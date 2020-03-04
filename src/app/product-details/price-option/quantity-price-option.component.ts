import {Component, Input, OnInit} from "@angular/core";
import {PriceOption} from "../../catalogue/model/publish/price-option";
import {CatalogueLine} from '../../catalogue/model/publish/catalogue-line';
import {EmptyFormBase} from '../../common/validation/empty-form-base';
/**
 * Created by suat on 28-Aug-18.
 */

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

    constructor() {
        super();
    }

    ngOnInit() {
        this.discountStep = this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value;

        // initialize form controls
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy(): void {
        this.removeViewFormFromParentForm();
    }
}
