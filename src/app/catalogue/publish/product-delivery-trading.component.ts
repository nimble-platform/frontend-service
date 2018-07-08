import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { INCOTERMS } from "../model/constants";

@Component({
    selector: "product-delivery-trading",
    templateUrl: "./product-delivery-trading.component.html",
    styleUrls: ["./product-delivery-trading.component.css"]
})
export class ProductDeliveryTradingComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    INCOTERMS = INCOTERMS;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }
}
