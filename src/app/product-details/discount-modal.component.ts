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

import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PriceOption } from '../catalogue/model/publish/price-option';
import { PRICE_OPTIONS } from '../catalogue/model/constants';
import { roundToTwoDecimals, selectPreferredValues } from '../common/utils';
import { DiscountPriceWrapper } from "../common/discount-price-wrapper";
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "discount-modal",
    templateUrl: "./discount-modal.component.html",
    styleUrls: ['./discount-modal.component.css']
})
export class DiscountModalComponent implements OnInit {

    @ViewChild("modal") modal: ElementRef;

    orderedQuantityDiscounts: PriceOption[] = [];
    productPropertyDiscounts: PriceOption[] = [];
    deliveryPeriodDiscounts: PriceOption[] = [];
    incotermDiscounts: PriceOption[] = [];
    paymentMeanDiscounts: PriceOption[] = [];
    deliveryLocationDiscount: PriceOption[] = [];

    PRICE_OPTIONS = PRICE_OPTIONS;
    currencyId = null;
    totalDiscount = null;

    constructor(private translate: TranslateService,
        private modalService: NgbModal) {
    }

    ngOnInit() {

    }

    getPropertyName = selectPreferredValues;

    open(priceWrapper: DiscountPriceWrapper) {
        let appliedDiscounts = priceWrapper.appliedDiscounts;
        this.currencyId = priceWrapper.currency;

        this.resetDiscounts();
        for (let discount of appliedDiscounts) {
            switch (discount.typeID) {
                case PRICE_OPTIONS.ORDERED_QUANTITY.typeID:
                    this.orderedQuantityDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.DELIVERY_LOCATION.typeID:
                    this.deliveryLocationDiscount.push(discount);
                    break;
                case PRICE_OPTIONS.PRODUCT_PROPERTY.typeID:
                    this.productPropertyDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.DELIVERY_PERIOD.typeID:
                    this.deliveryPeriodDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.INCOTERM.typeID:
                    this.incotermDiscounts.push(discount);
                    break;
                case PRICE_OPTIONS.PAYMENT_MEAN.typeID:
                    this.paymentMeanDiscounts.push(discount);
                    break;
            }
        }
        this.totalDiscount = priceWrapper.calculateTotalDiscount();

        this.modalService.open(this.modal).result.then((result) => {

        }, () => {

        });

    }

    private resetDiscounts(): void {
        this.orderedQuantityDiscounts = [];
        this.deliveryLocationDiscount = [];
        this.productPropertyDiscounts = [];
        this.deliveryPeriodDiscounts = [];
        this.incotermDiscounts = [];
        this.paymentMeanDiscounts = [];
    }

    private getAbsValue(value: number): number {
        return roundToTwoDecimals(Math.abs(value));
    }
}
