import {Component, Input} from '@angular/core';
import {PriceOption} from '../../model/publish/price-option';
import {CatalogueLine} from '../../model/publish/catalogue-line';
import { INCOTERMS } from '../../model/constants';

@Component({
    selector: "incoterms-price-option",
    templateUrl: "./incoterms-price-option-component.html"
})
export class IncotermsPriceOptionComponent {
    @Input() catalogueLine: CatalogueLine;
    @Input() priceOption: PriceOption;

    INCOTERMS: string[] = INCOTERMS;
}
