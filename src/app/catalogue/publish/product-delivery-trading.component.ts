import { Component, OnInit, Input } from "@angular/core";
import { INCOTERMS } from "../model/constants";
import { ProductWrapper } from "../../common/product-wrapper";
import {Text} from "../model/publish/text";
import { DEFAULT_LANGUAGE} from '../model/constants';

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
        if(this.wrapper.line.goodsItem.deliveryTerms.specialTerms == null || this.wrapper.line.goodsItem.deliveryTerms.specialTerms.length == 0){
            this.wrapper.line.goodsItem.deliveryTerms.specialTerms = [new Text(null,DEFAULT_LANGUAGE())];
        }
    }

}
