import {Component, Input} from "@angular/core";
import {PriceOption} from "../../catalogue/model/publish/price-option";
import {copy, getPropertyValueAsString, getPropertyValues, getPropertyValuesAsStrings, selectPreferredValues} from '../../common/utils';
import {ItemProperty} from "../../catalogue/model/publish/item-property";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
import {Quantity} from "../../catalogue/model/publish/quantity";
import {Text} from '../../catalogue/model/publish/text';
import {TranslateService} from '@ngx-translate/core';

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
    @Input() readonly:boolean = false;
    @Input() index: number;
    @Input() discountUnits;

constructor(
        private translate: TranslateService
    ) {}

    getItemPropertyName = selectPreferredValues;
    getPropertyValuesAsStrings=getPropertyValuesAsStrings;

    selectProperty(itemPropertyId: string): void {
        // ignore if the property is already selected
        let copyProperty: ItemProperty = this.priceOption.additionalItemProperty.find(property => itemPropertyId == property.id);
        if(copyProperty != null) {
            return;
        }

        // retrieve item property
        let itemProperty: ItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.find(property => property.id == itemPropertyId);
        copyProperty = UBLModelUtils.removeHjidFieldsFromObject(copy(itemProperty));
        copyProperty.value = [];
        copyProperty.valueDecimal = [];
        copyProperty.valueQuantity = [];

        this.priceOption.additionalItemProperty.push(copyProperty);
        this.priceOption.additionalItemProperty = [].concat(this.priceOption.additionalItemProperty);
    }

    getOriginalValuesOfProperty(copyProperty): any {
        let itemProperty: ItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.find(property => property.id == copyProperty.id);
        return getPropertyValues(itemProperty);
    }

    getValueAsString(value:any,valueQualifier:string){
        return getPropertyValueAsString(value,valueQualifier);
    }

    selectPropertyValue(value: any, copyProperty: ItemProperty): void {
        switch (copyProperty.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER": {
                let index: number = copyProperty.valueDecimal.findIndex(propVal => propVal == value)
                index !== -1 ? copyProperty.valueDecimal.splice(index, 1) : copyProperty.valueDecimal.push(value);
                break;
            }
            case "QUANTITY": {
                let quantityVal: Quantity = value;
                let index: number = copyProperty.valueQuantity.findIndex(propVal => propVal.value == quantityVal.value && propVal.unitCode == quantityVal.unitCode)
                index !== -1 ? copyProperty.valueQuantity.splice(index, 1) : copyProperty.valueQuantity.push(new Quantity(quantityVal.value,quantityVal.unitCode));
                break;
            }
            case "STRING": {
                let index: number = copyProperty.value.findIndex(propVal => propVal.value == value.value && propVal.languageID == value.languageID)
                index !== -1 ? copyProperty.value.splice(index, 1) : copyProperty.value.push(new Text(value.value,value.languageID));
                break;
            }
        }
        this.priceOption.additionalItemProperty = [].concat(this.priceOption.additionalItemProperty);
    }

    removeOption(index: number): void {
        this.priceOption.additionalItemProperty.splice(index, 1);
        this.priceOption.additionalItemProperty = [].concat(this.priceOption.additionalItemProperty);
    }

    getCheckedStatus(value: any, copyProperty: ItemProperty): boolean {
        switch (copyProperty.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER": {
                let index: number = copyProperty.valueDecimal.findIndex(propVal => propVal == value)
                return index != -1;
            }
            case "QUANTITY": {
                let quantityVal: Quantity = value;
                let index: number = copyProperty.valueQuantity.findIndex(propVal => propVal.value == quantityVal.value && propVal.unitCode == quantityVal.unitCode)
                return index != -1;
            }
            case "STRING": {
                let index: number = copyProperty.value.findIndex(propVal => propVal.value == value.value && propVal.languageID == value.languageID)
                return index != -1;
            }
        }
    }
}
