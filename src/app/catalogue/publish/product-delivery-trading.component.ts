/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit, Input } from "@angular/core";
import { INCOTERMS } from "../model/constants";
import { ProductWrapper } from "../../common/product-wrapper";
import { Text } from "../model/publish/text";
import { DEFAULT_LANGUAGE } from '../model/constants';

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
        if (this.wrapper.line.goodsItem.deliveryTerms.specialTerms == null || this.wrapper.line.goodsItem.deliveryTerms.specialTerms.length == 0) {
            this.wrapper.line.goodsItem.deliveryTerms.specialTerms = [new Text(null, DEFAULT_LANGUAGE())];
        }
    }

}
