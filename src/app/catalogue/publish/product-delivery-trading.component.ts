import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { Quantity } from "../model/publish/quantity";
import { ProductWrapper } from "../../common/product-wrapper";
import { CURRENCIES, INCOTERMS } from "../model/constants";

@Component({
    selector: "product-delivery-trading",
    templateUrl: "./product-delivery-trading.component.html",
    styleUrls: ["./product-delivery-trading.component.css"]
})
export class ProductDeliveryTradingComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    // TODO: later, get these from a service?
    currencies = CURRENCIES;
    INCOTERMS = INCOTERMS;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }
}
