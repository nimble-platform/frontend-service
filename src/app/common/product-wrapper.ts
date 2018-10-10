import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import { Predicate } from "@angular/core";
import { ItemProperty } from "../catalogue/model/publish/item-property";
import { PAYMENT_MEANS } from "../catalogue/model/constants";
import { UBLModelUtils } from "../catalogue/model/ubl-model-utils";
import { sanitizePropertyName, getPropertyKey, periodToString, isCustomProperty, getPropertyValues, isTransportService, selectName } from "./utils";
import { PriceWrapper } from "./price-wrapper";
import { CompanyNegotiationSettings } from "../user-mgmt/model/company-negotiation-settings";

/**
 * Wrapper class for Catalogue line.
 * This class offers useful getters used in the product details page.
 */
export class ProductWrapper {

    private priceWrapper: PriceWrapper;

    constructor(public line: CatalogueLine,
                public negotiationSettings: CompanyNegotiationSettings) {
        this.priceWrapper = new PriceWrapper(line.requiredItemLocationQuantity.price);
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

    getPackaging(): string {
        const qty = this.goodsItem.containingPackage.quantity;
        const type = this.goodsItem.containingPackage.packagingTypeCode;
        if(!qty.value || !type.value) {
            return "Not specified";
        }

        return `${qty.value} ${qty.unitCode} per ${type.value}`;
    }

    getSpecialTerms(): string {
        return this.goodsItem.deliveryTerms.specialTerms[0].value || "None";
    }

    getDeliveryPeriod(): string {
        return periodToString(this.goodsItem.deliveryTerms.estimatedDeliveryPeriod);
    }

    getWarrantyPeriod(): string {
        return periodToString(this.line.warrantyValidityPeriod);
    }

    getIncoterms(): string {
        return this.goodsItem.deliveryTerms.incoterms || "None";
    }

    getPaymentTerms(): string {
        return this.negotiationSettings.paymentTerms[0];
    }

    getPaymentMeans(): string {
        return this.negotiationSettings.paymentMeans[0];
    }

    getFreeSample(): string {
        return this.line.freeOfChargeIndicator ? "Yes" : "No";
    }

    getPricePerItem(): string {
        return this.priceWrapper.pricePerItemString;
    }

    getPropertyName(property: ItemProperty): string {
        return sanitizePropertyName(selectName(property));
    }

    getLogisticsStatus(): boolean {
        return isTransportService(this.line);
    }

    /*
     * Private methods
     */
    
    private getUniquePropertiesWithFilter(filter: Predicate<ItemProperty>): ItemProperty[] {
        if(!this.item) {
            return [];
        }

        const duplicates: any = {};
        const result = [];
        this.item.additionalItemProperty.forEach(prop => {
            if(!filter(prop)) {
                return;
            }

            const key = getPropertyKey(prop);
            if(!duplicates[key] || isCustomProperty(prop)) {
                result.push(prop);
            }

            duplicates[key] = true;
        });

        return result.sort((p1, p2) => selectName(p1).localeCompare(selectName(p2)));
    }

}