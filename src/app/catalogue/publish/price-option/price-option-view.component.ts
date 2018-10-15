import {Component, Input} from '@angular/core';
import {PriceOption} from '../../model/publish/price-option';
import {CatalogueLine} from '../../model/publish/catalogue-line';
import { INCOTERMS } from '../../model/constants';

@Component({
    selector: "price-option-view",
    templateUrl: "./price-option-view-component.html"
})
export class PriceOptionViewComponent {
    @Input() catalogueLine: CatalogueLine;
    @Input() priceOption: PriceOption;

    INCOTERMS: string[] = INCOTERMS;
}
