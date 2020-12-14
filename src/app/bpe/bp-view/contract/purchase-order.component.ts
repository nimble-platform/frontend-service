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

import {Component, Input, OnInit} from '@angular/core';
import * as myGlobals from '../../../globals';
import {roundToTwoDecimals, selectPreferredValue} from '../../../common/utils';
import {TranslateService} from '@ngx-translate/core';
import {NegotiationModelWrapper} from '../negotiation/negotiation-model-wrapper';
import {PriceWrapper} from '../../../common/price-wrapper';

@Component({
    selector: 'purchase-order',
    templateUrl: './purchase-order.component.html',
    styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {

    config = myGlobals.config;

    // this component expects exactly one wrapper
    @Input() negotiationModelWrappers: NegotiationModelWrapper[];
    @Input() priceWrappers: PriceWrapper[];
    // flag if we use quotation wrapper inside the negotiation model wrapper or not
    // it is used when the negotiation model wrappers are provided
    @Input() useQuotationWrapper: boolean = false;

    // list of boolean flags if show more text is displayed or not
    descriptionShowMore: boolean[] = [];
    // keeps the descriptions of products
    descriptions: string[] = [];

    selectPreferredValue = selectPreferredValue;

    constructor(private translate: TranslateService) {

    }

    ngOnInit(): void {
        // populate description and show more arrays
        if (this.negotiationModelWrappers) {
            for (let wrapper of this.negotiationModelWrappers) {
                let description = selectPreferredValue(wrapper.catalogueLine.goodsItem.item.description);
                this.descriptions.push(description);
                this.descriptionShowMore.push(true);
            }
        } else {
            for (let wrapper of this.priceWrappers) {
                let description = selectPreferredValue(wrapper.item.description);
                this.descriptions.push(description);
                this.descriptionShowMore.push(true);
            }
        }
    }

    // methods to calculate total prices
    getTotalPriceString() {
        let totalPrice = 0;
        let currency = null;
        if (this.negotiationModelWrappers) {
            for (let negotiationModelWrapper of this.negotiationModelWrappers) {
                if (this.useQuotationWrapper) {
                    totalPrice += negotiationModelWrapper.newQuotationWrapper.priceWrapper.totalPrice;
                } else {
                    totalPrice += negotiationModelWrapper.rfqTotal;
                }
            }
            currency = this.negotiationModelWrappers[0].currency
        } else {
            for (let priceWrapper of this.priceWrappers) {
                totalPrice += priceWrapper.totalPrice;
            }
            currency = this.priceWrappers[0].currency
        }
        if (totalPrice == 0) {
            return this.translate.instant('On demand');
        }
        return roundToTwoDecimals(totalPrice) + ' ' + currency;
    }

    getVatTotalString() {
        let vatTotal = 0;
        let currency = null;
        if (this.negotiationModelWrappers) {
            for (let negotiationModelWrapper of this.negotiationModelWrappers) {
                if (this.useQuotationWrapper) {
                    vatTotal += negotiationModelWrapper.newQuotationWrapper.priceWrapper.vatTotal;
                } else {
                    vatTotal += negotiationModelWrapper.rfqVatTotal;
                }
            }
            currency = this.negotiationModelWrappers[0].currency
        } else {
            for (let priceWrapper of this.priceWrappers) {
                vatTotal += priceWrapper.vatTotal
            }
            currency = this.priceWrappers[0].currency
        }
        if (vatTotal == 0) {
            return this.translate.instant('On demand');
        }
        return roundToTwoDecimals(vatTotal) + ' ' + currency;
    }

    getGrossTotalString() {
        let grossTotal = 0;
        let currency = null;
        if (this.negotiationModelWrappers) {
            for (let negotiationModelWrapper of this.negotiationModelWrappers) {
                if (this.useQuotationWrapper) {
                    grossTotal += negotiationModelWrapper.newQuotationWrapper.priceWrapper.grossTotal;
                } else {
                    grossTotal += negotiationModelWrapper.rfqGrossTotal;
                }
            }
            currency = this.negotiationModelWrappers[0].currency
        } else {
            for (let priceWrapper of this.priceWrappers) {
                grossTotal += priceWrapper.grossTotal;
            }
            currency = this.priceWrappers[0].currency
        }
        if (grossTotal == 0) {
            return this.translate.instant('On demand');
        }
        return roundToTwoDecimals(grossTotal) + ' ' + currency;
    }
}
