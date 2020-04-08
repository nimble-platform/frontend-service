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

import { DISCOUNT_TARGETS } from "../../catalogue/model/constants";
import { Component, Input, OnInit } from "@angular/core";
import { PriceOption } from "../../catalogue/model/publish/price-option";
import { AllowanceCharge } from "../../catalogue/model/publish/allowance-charge";
import { Amount } from "../../catalogue/model/publish/amount";
import { amountToString, copy } from '../../common/utils';
import { EmptyFormBase } from '../../common/validation/empty-form-base';

@Component({
    selector: "discount-target",
    templateUrl: "./discount-target.component.html"
})
export class DiscountTargetComponent extends EmptyFormBase implements OnInit {

    @Input() priceOption: PriceOption;
    @Input() discountUnits;
    @Input() readonly: boolean = false;

    selectedDiscountTarget: string = DISCOUNT_TARGETS.TOTAL_PRICE;
    amount: Amount;

    discountTargets = DISCOUNT_TARGETS;
    object = Object;

    constructor() {
        super();
    }

    ngOnInit() {
        // if the discount target is already set, we should set the selected discount target properly
        if (this.priceOption.itemLocationQuantity.allowanceCharge[0].perUnitAmount == null) {
            this.selectedDiscountTarget = DISCOUNT_TARGETS.TOTAL_PRICE;
            this.amount = this.priceOption.itemLocationQuantity.allowanceCharge[0].amount;

        } else if (this.priceOption.itemLocationQuantity.allowanceCharge[0].amount == null) {
            this.selectedDiscountTarget = DISCOUNT_TARGETS.PER_UNIT;
            this.amount = this.priceOption.itemLocationQuantity.allowanceCharge[0].perUnitAmount;

        } else {
            this.amount = this.priceOption.itemLocationQuantity.allowanceCharge[0].amount;
        }
    }

    changeDiscountTarget(discountTarget: string, allowanceCharge: AllowanceCharge): void {
        if (discountTarget == DISCOUNT_TARGETS.PER_UNIT) {
            if (allowanceCharge.amount != null) {
                allowanceCharge.perUnitAmount = allowanceCharge.amount;
                allowanceCharge.amount = null;
                this.amount = allowanceCharge.perUnitAmount;
            }

        } else {
            if (allowanceCharge.perUnitAmount != null) {
                allowanceCharge.amount = allowanceCharge.perUnitAmount;
                allowanceCharge.perUnitAmount = null;
                this.amount = allowanceCharge.amount;
            }
        }
    }

    amountToString() {
        // we display positive numbers for discount and charge when they are readonly.
        let amount = copy(this.amount);
        amount.value = Math.abs(this.amount.value);
        return amountToString(amount);
    }
}
