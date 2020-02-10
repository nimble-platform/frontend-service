import {Component, Input} from '@angular/core';
import {PriceOption} from '../../catalogue/model/publish/price-option';
import {CatalogueLine} from '../../catalogue/model/publish/catalogue-line';
import { PRICE_OPTIONS } from '../../catalogue/model/constants';

@Component({
    selector: "price-option-view",
    templateUrl: "./price-option-view-component.html"
})
export class PriceOptionViewComponent {
    @Input() catalogueLine: CatalogueLine;
    @Input() priceOption: PriceOption;

    @Input() incoterms: string[] = [];
    @Input() paymentMeans: string[] = [];
    @Input() deliveryPeriodUnits: string[] = [];

    @Input() discountUnits;
    @Input() readonly:boolean = false;

    priceOptions = PRICE_OPTIONS;
}
