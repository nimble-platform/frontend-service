import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import { INCOTERMS } from "../model/constants";
import {Text} from "../model/publish/text";

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

    private newSpecialTerms: any = {};
    private languages: Array<string> = ["en", "es", "de", "tr", "it"];

    addSpecialTerms() {
        let specialTermsText = new Text(this.newSpecialTerms.value, this.newSpecialTerms.languageID);

        if (this.catalogueLine.goodsItem.deliveryTerms.specialTerms === null) {
            this.catalogueLine.goodsItem.deliveryTerms.specialTerms = [];
        }

        this.catalogueLine.goodsItem.deliveryTerms.specialTerms.push(specialTermsText);

        this.newSpecialTerms = {};

        console.log(" $$$ Item: ", this.catalogueLine.goodsItem);
    }

    deleteSpecialTerms(index) {
        this.catalogueLine.goodsItem.deliveryTerms.specialTerms.splice(index, 1);

        console.log(" $$$ Item: ", this.catalogueLine.goodsItem);
    }
    //////
}
