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
import {INCOTERMS, NON_PUBLIC_FIELD_ID} from '../model/constants';
import { ProductWrapper } from "../../common/product-wrapper";
import { Text } from "../model/publish/text";
import { DEFAULT_LANGUAGE } from '../model/constants';
import {CompanyNegotiationSettings} from '../../user-mgmt/model/company-negotiation-settings';
import {EmptyFormBase} from '../../common/validation/empty-form-base';
import * as myGlobals from '../../globals';
import {TermsAndConditionUtils} from '../model/model-util/terms-and-condition-utils';
import {NonPublicInformation} from '../model/publish/non-public-information';
import {config} from '../../globals';
const PRODUCT_DELIVERY_TRADING_INPUT = 'product_delivery_trading';
@Component({
    selector: "product-delivery-trading",
    templateUrl: "./product-delivery-trading.component.html",
    styleUrls: ["./product-delivery-trading.component.css"]
})
export class ProductDeliveryTradingComponent extends EmptyFormBase implements OnInit {

    @Input() wrapper: ProductWrapper;
    @Input() disabled: boolean;
    @Input() companyNegotiationSettings: CompanyNegotiationSettings;

    INCOTERMS = INCOTERMS;
    nonPublicInformationFunctionalityEnabled = config.nonPublicInformationFunctionalityEnabled
    NON_PUBLIC_FIELD_ID = NON_PUBLIC_FIELD_ID;
    private DELIVERY_TRADING_NON_PUBLIC_FIELD_IDS = [NON_PUBLIC_FIELD_ID.WARRANTY_PERIOD,NON_PUBLIC_FIELD_ID.INCOTERMS,NON_PUBLIC_FIELD_ID.DELIVERY_PERIOD,NON_PUBLIC_FIELD_ID.SPECIAL_TERMS,NON_PUBLIC_FIELD_ID.QUANTITY_PER_PACKAGE,NON_PUBLIC_FIELD_ID.PACKAGING_TYPE,NON_PUBLIC_FIELD_ID.CUSTOMIZABLE,NON_PUBLIC_FIELD_ID.SPARE_PART]

    product_filter_prod = myGlobals.product_filter_prod;
    constructor() {
        super(PRODUCT_DELIVERY_TRADING_INPUT);
    }

    ngOnInit() {
        this.initViewFormAndAddToParentForm();
        if (this.wrapper.line.goodsItem.deliveryTerms.specialTerms == null || this.wrapper.line.goodsItem.deliveryTerms.specialTerms.length == 0) {
            this.wrapper.line.goodsItem.deliveryTerms.specialTerms = [new Text(null, DEFAULT_LANGUAGE())];
        }

        // set initial value of warranty and delivery periods to the values defined in the company negotiation settings
        if (this.wrapper.line.warrantyValidityPeriod.durationMeasure && !this.wrapper.line.warrantyValidityPeriod.durationMeasure.value) {
            this.wrapper.line.warrantyValidityPeriod.durationMeasure = TermsAndConditionUtils.getWarrantyPeriod(this.companyNegotiationSettings);
        }
        if (this.wrapper.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure &&
            !this.wrapper.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure.value) {
            this.wrapper.line.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure = TermsAndConditionUtils.getDeliveryPeriod(this.companyNegotiationSettings);
        }
    }

    onNonPublicClicked(fieldId, checked){
        if(checked){
            let nonPublicInformation:NonPublicInformation = new NonPublicInformation();
            nonPublicInformation.id = fieldId;
            this.wrapper.addNonPublicInformation(nonPublicInformation)
        } else{
            this.wrapper.removeNonPublicInformation(fieldId);
        }
    }

    isNonPublicChecked(fieldId){
        return this.wrapper.nonPublicInformation.findIndex(value => value.id === fieldId) !== -1;
    }

    markAllInformationAsNonPublic(checked){
        if(checked){
            this.DELIVERY_TRADING_NON_PUBLIC_FIELD_IDS.forEach(fieldId => {
                let nonPublicInformation:NonPublicInformation = new NonPublicInformation();
                nonPublicInformation.id = fieldId;
                this.wrapper.addNonPublicInformation(nonPublicInformation);
            })
        } else{
            this.DELIVERY_TRADING_NON_PUBLIC_FIELD_IDS.forEach(fieldId => {
                this.wrapper.removeNonPublicInformation(fieldId);
            })
        }
    }

    isAllInformationMarkedAsNonPublic(){
        for (let fieldId of this.DELIVERY_TRADING_NON_PUBLIC_FIELD_IDS) {
            if(this.wrapper.nonPublicInformation.findIndex(value => value.id === fieldId) === -1){
                return false;
            }
        }
        return true;
    }
}
