/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import {CatalogueLine} from '../catalogue/model/publish/catalogue-line';
import {Predicate} from '@angular/core';
import {ItemProperty} from '../catalogue/model/publish/item-property';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {
    copy,
    getPropertyKey,
    getPropertyValues,
    isCustomProperty,
    isLogisticsService,
    isTransportService,
    periodToString,
    sanitizePropertyName,
    selectName
} from './utils';
import {CompanyNegotiationSettings} from '../user-mgmt/model/company-negotiation-settings';
import {Quantity} from '../catalogue/model/publish/quantity';
import {Dimension} from '../catalogue/model/publish/dimension';
import {MultiValuedDimension} from '../catalogue/model/publish/multi-valued-dimension';
import {DiscountPriceWrapper} from './discount-price-wrapper';

/**
 * Wrapper class for Catalogue line.
 * This class offers useful getters used in the product details page.
 */
export class ProductWrapper {

    private priceWrapper: DiscountPriceWrapper;

    constructor(public line: CatalogueLine,
                public negotiationSettings: CompanyNegotiationSettings,
                public quantity: Quantity = new Quantity(1, line.requiredItemLocationQuantity.price.baseQuantity.unitCode)) {
        this.priceWrapper = new DiscountPriceWrapper(
            line.requiredItemLocationQuantity.price,
            copy(line.requiredItemLocationQuantity.price),
            line.requiredItemLocationQuantity.applicableTaxCategory[0].percent,
            this.quantity,
            this.line.priceOption,
            [],
            null, null, null, null, line.priceHidden);
    }

    get goodsItem() {
        return this.line.goodsItem;
    }

    get item() {
        return this.goodsItem.item;
    }

    getPropertiesWithListOfValues(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(prop => getPropertyValues(prop).length > 1);
    }

    getUniquePropertiesWithValue(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(prop => getPropertyValues(prop).length > 0);
    }

    getAllUniqueProperties(): ItemProperty[] {
        return this.getUniquePropertiesWithFilter(() => true);
    }

    getDimensions(includingNullValues: boolean = true): Dimension[] {
        if (!this.item) {
            return [];
        }
        const ret = [];
        this.item.dimension.forEach(prop => {
            if (includingNullValues) {
                if (prop.attributeID) {
                    ret.push(prop);
                }
            } else {
                if (prop.attributeID && prop.measure.value) {
                    ret.push(prop);
                }
            }
        });
        return ret;
    }

    // it creates MultiValuedDimensions using the item's dimensions
    // if the item has no dimensions, then it creates them using the given list of dimension units.
    getDimensionMultiValue(includeDimensionsWithNullValues: boolean = true, dimensions: string[] = []): MultiValuedDimension[] {
        let multiValuedDimensions: MultiValuedDimension[] = [];
        // add the missing dimensions
        let missingDimensions = dimensions.filter(unit => this.item.dimension.findIndex(dimension => dimension.attributeID == unit.charAt(0).toUpperCase() + unit.slice(1)) == -1);
        if (missingDimensions.length > 0) {
            this.item.dimension = this.item.dimension.concat(UBLModelUtils.createDimensions(missingDimensions));
        }
        for (let dimension of this.item.dimension) {
            if (!includeDimensionsWithNullValues && !dimension.measure.value) {
                continue;
            }
            let found: boolean = false;
            for (let multiValuedDimension of multiValuedDimensions) {
                if (multiValuedDimension.attributeID == dimension.attributeID) {
                    multiValuedDimension.measure.push(dimension.measure);
                    found = true;
                    break;
                }
            }
            if (!found) {
                multiValuedDimensions.push(new MultiValuedDimension(dimension.attributeID, [dimension.measure]));
            }
        }
        return multiValuedDimensions;
    }

    addDimension(attributeId: string) {
        let dimension: Dimension = new Dimension(attributeId);
        this.item.dimension.push(dimension);
    }

    removeDimension(attributeId: string, quantity: Quantity): void {
        let index: number = this.item.dimension.slice().reverse().findIndex(dim => dim.attributeID == attributeId && dim.measure.value == quantity.value);
        let count = this.item.dimension.length - 1;
        let finalIndex = count - index;
        this.item.dimension.splice(finalIndex, 1);
    }

    getPackaging(): string {
        const qty = this.goodsItem.containingPackage.quantity;
        const type = this.goodsItem.containingPackage.packagingTypeCode;
        if (!qty.value || !type.value) {
            return 'Not specified';
        }

        return `${qty.value} ${qty.unitCode} per ${type.value}`;
    }

    getSpecialTerms(): string {
        return this.goodsItem.deliveryTerms.specialTerms.length > 0 && this.goodsItem.deliveryTerms.specialTerms[0].value ? this.goodsItem.deliveryTerms.specialTerms[0].value : 'None';
    }

    getDeliveryPeriod(): Quantity {
        return this.goodsItem.deliveryTerms.estimatedDeliveryPeriod.durationMeasure;
    }

    getDeliveryPeriodString(): string {
        return periodToString(this.goodsItem.deliveryTerms.estimatedDeliveryPeriod);
    }

    getWarrantyPeriod(): Quantity {
        return this.line.warrantyValidityPeriod.durationMeasure;
    }

    getIncoterms(): string {
        return this.goodsItem.deliveryTerms.incoterms || 'None';
    }

    getPaymentTerms(): string {
        return this.negotiationSettings.paymentTerms[0];
    }

    getPaymentMeans(): string {
        return this.negotiationSettings.paymentMeans[0];
    }

    getFreeSample(): string {
        return this.line.freeOfChargeIndicator ? 'Yes' : 'No';
    }

    getCustomizable(): string {
        return this.line.goodsItem.item.customizable ? 'Yes' : 'No';
    }

    getSparePart(): string {
        return this.line.goodsItem.item.sparePart ? 'Yes' : 'No';
    }

    getPricePerItem(): string {
        return this.priceWrapper.discountedPricePerItemString;
    }

    getVat(): string {
        return this.line.requiredItemLocationQuantity.applicableTaxCategory[0] ? this.line.requiredItemLocationQuantity.applicableTaxCategory[0].percent + '' : '';
    }

    getMinimumOrderQuantity(): string {
        if (!this.line.minimumOrderQuantity || !this.line.minimumOrderQuantity.value) {
            return 'Not specified';
        }

        return `${this.line.minimumOrderQuantity.value} ${this.line.minimumOrderQuantity.unitCode}`;
    }

    getPropertyName(property: ItemProperty): string {
        return sanitizePropertyName(selectName(property));
    }

    getLogisticsStatus(): boolean {
        return isLogisticsService(this.line);
    }

    isTransportService(): boolean {
        return isTransportService(this.line);
    }

    getAdditionalDocuments() {
        return this.item.itemSpecificationDocumentReference;
    }

    /*
     * Private methods
     */

    private getUniquePropertiesWithFilter(filter: Predicate<ItemProperty>): ItemProperty[] {
        if (!this.item) {
            return [];
        }

        const duplicates: any = {};
        const result = [];
        this.item.additionalItemProperty.forEach(prop => {
            if (!filter(prop)) {
                return;
            }

            const key = getPropertyKey(prop);
            if (!duplicates[key] || isCustomProperty(prop)) {
                result.push(prop);
            }

            duplicates[key] = true;
        });

        return result.sort((p1, p2) => selectName(p1).localeCompare(selectName(p2)));
    }

}
