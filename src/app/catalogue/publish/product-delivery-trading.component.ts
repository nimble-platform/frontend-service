import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { INCOTERMS } from "../model/constants";
import { ProductWrapper } from "../../common/product-wrapper";
import {Text} from "../model/publish/text";

@Component({
    selector: "product-delivery-trading",
    templateUrl: "./product-delivery-trading.component.html",
    styleUrls: ["./product-delivery-trading.component.css"]
})
export class ProductDeliveryTradingComponent implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() disabled: boolean

    INCOTERMS = INCOTERMS;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }

    private newSpecialTerms: any = {};
    private languages: Array<string> = ["en", "es", "de", "tr", "it"];

    addSpecialTerms() {
        let specialTermsText = new Text(this.newSpecialTerms.value, this.newSpecialTerms.languageID);

        if (this.wrapper.line.goodsItem.deliveryTerms.specialTerms === null) {
            this.wrapper.line.goodsItem.deliveryTerms.specialTerms = [];
        }

        this.wrapper.line.goodsItem.deliveryTerms.specialTerms.push(specialTermsText);

        this.newSpecialTerms = {};

        console.log(" $$$ Item: ", this.wrapper.line.goodsItem);
    }

    deleteSpecialTerms(index) {
        this.wrapper.line.goodsItem.deliveryTerms.specialTerms.splice(index, 1);

        console.log(" $$$ Item: ", this.wrapper.line.goodsItem);
    }
    //////
}
