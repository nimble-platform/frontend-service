import {PriceOption} from "../model/publish/price-option";
import {CURRENCIES, INCOTERMS} from "../model/constants";
import {Component, Input, OnInit} from "@angular/core";
import {CatalogueLine} from "../model/publish/catalogue-line";
import {Quantity} from "../model/publish/quantity";
/**
 * Created by suat on 28-Aug-18.
 */
@Component({
    selector: "price-option",
    templateUrl: "./price-option.component.html",
    styleUrls: ["./price-option.component.css"]
})
export class PriceOptionComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    CURRENCIES = CURRENCIES;
    INCOTERMS = INCOTERMS;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }

    addPriceOption() {

    }
}
