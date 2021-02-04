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

import { Component, Input, OnInit } from '@angular/core';
import { PriceOption } from '../../catalogue/model/publish/price-option';
import { CatalogueLine } from '../../catalogue/model/publish/catalogue-line';
import { PRICE_OPTIONS, NON_PUBLIC_FIELD_ID } from '../../catalogue/model/constants';
import { Quantity } from '../../catalogue/model/publish/quantity';
import { PaymentMeans } from '../../catalogue/model/publish/payment-means';
import { Address } from '../../catalogue/model/publish/address';
import { Period } from '../../catalogue/model/publish/period';
import { CompanyNegotiationSettings } from '../../user-mgmt/model/company-negotiation-settings';
import { EmptyFormBase } from '../../common/validation/empty-form-base';
import {NonPublicInformation} from '../../catalogue/model/publish/non-public-information';
import {config} from '../../globals';
const DISCOUNT_DETAILS_INPUT = 'discount_details';
@Component({
    selector: "discount-details",
    templateUrl: "./discount-details.component.html"
})
export class DiscountDetailsComponent extends EmptyFormBase implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() companyNegotiationSettings: CompanyNegotiationSettings;
    @Input() readonly: boolean = false;

    priceOptions = PRICE_OPTIONS;

    discountUnits = [];

    object = Object;

    NON_PUBLIC_FIELD_ID = NON_PUBLIC_FIELD_ID;
    nonPublicInformationFunctionalityEnabled = config.nonPublicInformationFunctionalityEnabled;
    constructor() {
        super(DISCOUNT_DETAILS_INPUT);
    }

    ngOnInit() {
        this.updateDiscountUnits();
        this.initViewFormAndAddToParentForm();
    }

    /**
     * Add price option for the given price option type
     * @param priceOptionType the type of price option
     * @param chargeIndicator whether the price option indicates a charge (i.e, it is true) or discount (i.e, it is false)
     * */
    addPriceOption(priceOptionType: any, chargeIndicator:boolean): void {
        let priceOption: PriceOption = new PriceOption();

        priceOption.typeID = priceOptionType;

        if (priceOptionType == PRICE_OPTIONS.ORDERED_QUANTITY.typeID) {
            priceOption.itemLocationQuantity.minimumQuantity = new Quantity(this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value, this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode);

        } else if (priceOptionType == PRICE_OPTIONS.PRODUCT_PROPERTY.typeID) {
            priceOption.additionalItemProperty = [];
        } else if (priceOptionType == PRICE_OPTIONS.INCOTERM.typeID) {
            priceOption.incoterms = [];
        } else if (priceOptionType == PRICE_OPTIONS.PAYMENT_MEAN.typeID) {
            priceOption.paymentMeans = [new PaymentMeans()];
        } else if (priceOptionType == PRICE_OPTIONS.DELIVERY_LOCATION.typeID) {
            priceOption.itemLocationQuantity.applicableTerritoryAddress = [new Address()];
        } else if (priceOptionType == PRICE_OPTIONS.DELIVERY_PERIOD.typeID) {
            priceOption.estimatedDeliveryPeriod = new Period();
        }

        priceOption.itemLocationQuantity.allowanceCharge[0].chargeIndicator = chargeIndicator;
        this.catalogueLine.priceOption.push(priceOption);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
        // update discount unit list
        this.updateDiscountUnits();
    }

    removePriceOption(index: number): void {
        this.catalogueLine.priceOption.splice(index, 1);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
    }

    updateDiscountUnits() {
        this.discountUnits = [].concat([this.catalogueLine.requiredItemLocationQuantity.price.priceAmount.currencyID, "%"]);
    }

    onNonPublicClicked(fieldId, checked){
        if(checked){
            let nonPublicInformation:NonPublicInformation = new NonPublicInformation();
            nonPublicInformation.id = fieldId;
            this.catalogueLine.nonPublicInformation.push(nonPublicInformation);
        } else{
            const index = this.catalogueLine.nonPublicInformation.findIndex(value => value.id === fieldId);
            this.catalogueLine.nonPublicInformation.splice(index,1);
        }
    }

    isNonPublicChecked(fieldId){
        return this.catalogueLine.nonPublicInformation.findIndex(value => value.id === fieldId) !== -1;
    }
}
