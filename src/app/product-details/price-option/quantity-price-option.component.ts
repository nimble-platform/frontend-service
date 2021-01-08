/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { PriceOption } from "../../catalogue/model/publish/price-option";
import { CatalogueLine } from '../../catalogue/model/publish/catalogue-line';
import { EmptyFormBase } from '../../common/validation/empty-form-base';
const QUANTITY_PRICE_OPTION = 'quantity_price_option';

@Component({
    selector: "quantity-price-option",
    templateUrl: "./quantity-price-option.component.html"
})
export class QuantityPriceOptionComponent extends EmptyFormBase implements OnInit, OnDestroy {
    @Input() catalogueLine: CatalogueLine;
    @Input() priceOption: PriceOption;
    @Input() discountUnits;
    @Input() readonly: boolean = false;
    discountStep: number;

    constructor() {
        super(QUANTITY_PRICE_OPTION);
    }

    ngOnInit() {
        this.discountStep = this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value;

        // initialize form controls
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy(): void {
        this.removeViewFormFromParentForm();
    }
}
