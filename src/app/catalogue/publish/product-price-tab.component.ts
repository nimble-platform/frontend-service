import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { CURRENCIES } from "../model/constants";

@Component({
    selector: "product-price-tab",
    templateUrl: "./product-price-tab.component.html",
    styleUrls: ["./product-price-tab.component.css"]
})
export class ProductPriceTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    // TODO: later, get these from a service?
    CURRENCIES = CURRENCIES;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }
}
