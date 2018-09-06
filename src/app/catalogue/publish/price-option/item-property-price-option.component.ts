import {Component, Input} from "@angular/core";
import {PriceOption} from "../../model/publish/price-option";
import {copy, getPropertyValuesAsStrings, sanitizePropertyName} from "../../../common/utils";
import {ItemProperty} from "../../model/publish/item-property";
import {UBLModelUtils} from "../../model/ubl-model-utils";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {Quantity} from "../../model/publish/quantity";

/**
 * Created by suat on 03-Sep-18.
 */
@Component({
    selector: "item-property-price-option",
    templateUrl: "./item-property-price-option.component.html",
    styleUrls: ["./item-property-price-option.component.css"]
})
export class ItemPropertyPriceOptionComponent {

    @Input() catalogueLine: CatalogueLine;
    @Input() priceOption: PriceOption;
    @Input() index: number;
    sanitizePropertyName = sanitizePropertyName;

    selectProperty(itemPropertyId: string): void {
        // ignore if the property is already selected
        let copyProperty: ItemProperty = this.priceOption.itemProperty.find(property => itemPropertyId == property.id);
        if(copyProperty != null) {
            return;
        }

        // retrieve item property
        let itemProperty: ItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.find(property => property.id == itemPropertyId);
        copyProperty = UBLModelUtils.removeHjidFieldsFromObject(copy(itemProperty));
        copyProperty.value = [];
        copyProperty.valueDecimal = [];
        copyProperty.valueQuantity = [];

        this.priceOption.itemProperty.push(copyProperty);
        this.priceOption.itemProperty = [].concat(this.priceOption.itemProperty);
    }

    getOriginalValuesOfProperty(copyProperty): string[] {
        let itemProperty: ItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.find(property => property.id == copyProperty.id);
        return getPropertyValuesAsStrings(itemProperty);
    }

    selectPropertyValue(value: any, copyProperty: ItemProperty): void {
        switch (copyProperty.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
            case "REAL_MEASURE": {
                let index: number = copyProperty.valueDecimal.findIndex(propVal => propVal == value)
                index !== -1 ? copyProperty.valueDecimal.splice(index, 1) : copyProperty.valueDecimal.push(value);
            }
            case "QUANTITY": {
                let quantityVal: Quantity = value;
                let index: number = copyProperty.valueQuantity.findIndex(propVal => propVal.value == quantityVal.value && propVal.unitCode == quantityVal.unitCode)
                index !== -1 ? copyProperty.value.splice(index, 1) : copyProperty.value.push(value);
            }
            case "STRING": {
                let index: number = copyProperty.value.findIndex(propVal => propVal == value)
                index !== -1 ? copyProperty.value.splice(index, 1) : copyProperty.value.push(value);
            }
        }
        this.priceOption.itemProperty = [].concat(this.priceOption.itemProperty);
    }

    removeOption(index: number): void {
        this.priceOption.itemProperty.splice(index, 1);
        this.priceOption.itemProperty = [].concat(this.priceOption.itemProperty);
    }

    getCheckedStatus(value: any, copyProperty: ItemProperty): boolean {
        switch (copyProperty.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
            case "REAL_MEASURE": {
                let index: number = copyProperty.valueDecimal.findIndex(propVal => propVal == value)
                return index != -1;
            }
            case "QUANTITY": {
                let quantityVal: Quantity = value;
                let index: number = copyProperty.valueQuantity.findIndex(propVal => propVal.value == quantityVal.value && propVal.unitCode == quantityVal.unitCode)
                return index != -1;
            }
            case "STRING": {
                let index: number = copyProperty.value.findIndex(propVal => propVal == value)
                return index != -1;
            }
        }
    }
}
