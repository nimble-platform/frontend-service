import { ItemProperty } from "../catalogue/model/publish/item-property";
import { Quantity } from "../catalogue/model/publish/quantity";
import { Period } from "../catalogue/model/publish/period";
import { Price } from "../catalogue/model/publish/price";
import { Category } from "../catalogue/model/category/category";
import { Property } from "../catalogue/model/category/property";
import { PropertyValueQualifier } from "../catalogue/model/publish/property-value-qualifier";
import { CUSTOM_PROPERTY_LIST_ID } from "../catalogue/model/constants";
import {Item} from '../catalogue/model/publish/item';
import {Text} from '../catalogue/model/publish/text';
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import {Amount} from "../catalogue/model/publish/amount";

const UI_NAMES: any = {
    STRING: "TEXT"
}

export function sanitizeDataTypeName(dataType: PropertyValueQualifier): string {
    if(UI_NAMES[dataType]) {
        return UI_NAMES[dataType]
    }
    return dataType;
}

export function sanitizePropertyName(name: string): string {
    if(!name || name.length === 0) {
        return "(no name)";
    }
    const result = name.replace(/([a-z])([A-Z])/g, '$1 $2');
    return result.substr(0, 1).toUpperCase() + result.substr(1);
}

export function copy<T = any>(object: T): T {
    return JSON.parse(JSON.stringify(object));
}

function isItemProperty(property: any): property is ItemProperty {
    return !!property.name; // preferredName for Property
}

export function selectPreferredName (cp: Category | Property) {
    let language = "en";
    for (let pName of cp.preferredName) {
        if(pName.languageID === language) {
            return pName.value;
        }
    }

    return cp.preferredName[0].value;
}

export function selectName (ip: ItemProperty | Item) {
    let language = "en";
    for (let pName of ip.name) {
        if(pName.languageID === language) {
            return pName.value;
        }
    }

    if (ip.name.length === 0)
        return '';

    return ip.name[0].value;
}

export function createText (value: string): Text {
    let language = "en";
    return new Text(value, language);
}

export function selectDescription (item:  Item) {
    if(item.description.length == 0){
        return null;
    }
    let language = "en";
    for (let pName of item.description) {
        if(pName.languageID === language) {
            return pName.value;
        }
    }

    return item.description[0].value;
}

export function selectItemPropertyValuesAsText (ip: ItemProperty, language: string): Text[] {
    if (language === null)
        language = "en";
    let result : Text[] = [];
    for (let pValue of ip.value) {
        if(pValue.languageID === language) {
            result.push(pValue);
        }
    }

    return result;
}

export function selectItemPropertyValuesAsString (ip: ItemProperty, language: string): string[] {
    if (language === null)
        language = "en";
    let result : string[] = [];
    for (let pValue of ip.value) {
        if(pValue.languageID === language) {
            result.push(pValue.value);
        }
    }

    return result;
}

export function getPropertyKey(property: Property | ItemProperty): string {
    if(isItemProperty(property)) {
        return selectName(property) + "___" + property.valueQualifier;
    }
    //console.log(' Property: ', property);
    return selectPreferredName(property) + "___" + property.dataType;
}

export function quantityToString(quantity: Quantity): string {
    if(quantity.value) {
        return `${quantity.value} ${quantity.unitCode}`;
    }
    return "";
}

export function amountToString(amount: Amount): string {
    if(amount.value) {
        return `${amount.value} ${amount.currencyID}`;
    }
    return "";
}

export function durationToString(duration: Quantity): string {
    if(duration.value > 0) {
        return quantityToString(duration);
    }
    if(duration.value === 0) {
        return "None";
    }
    return "Not defined";
}

export function periodToString(period: Period): string {
    return durationToString(period.durationMeasure);
}

const MAX_PRICE = 100000;

const STEPS_FOR_PRICE = 100;

export function getMaximumQuantityForPrice(price: Price): number {
    if(!price || !price.priceAmount.value) {
        return 100;
    }

    let result = MAX_PRICE / price.priceAmount.value;
    return roundFirstDigit(result) * getMagnitude(result);
}

export function getStepForPrice(price: Price): number {
    return getMaximumQuantityForPrice(price) / STEPS_FOR_PRICE;
}

function getMagnitude(value: number): number {
    return Math.pow(10, Math.floor(Math.log10(value)));
}

function round5(value: number): number {
    return Math.round(value / 5) * 5;
}

// rounds the first digit of a number to the nearest 5 or 10
function roundFirstDigit(value: number): number {
    let roundedDigit = round5(value / getMagnitude(value));
    if(roundedDigit == 0) {
        roundedDigit = 1;
    }
    return roundedDigit;
}

interface CurrenciesStringValues {
    [currencyId: string]: string
}

const CURRENCIES_STRING_VALUES: CurrenciesStringValues = {
    // EUR: "€", // disabled for now
    // USD: "$",
    // GBP: "₤"
}

export function currencyToString(currencyId: string): string {
    return CURRENCIES_STRING_VALUES[currencyId] || currencyId;
}

export function sortCategories(categories: Category[]): Category[] {
    let language = "en";
    return categories.sort((a, b) => selectPreferredName(a).localeCompare(selectPreferredName(b)));
}

export function sortProperties(properties: Property[]): Property[] {
    let language = "en";
    return properties.sort((a, b) => selectPreferredName(a).localeCompare(selectPreferredName(b)));
}

export function scrollToDiv(divId: string): void {
    document.getElementById(divId).scrollIntoView();
}

export function isCustomProperty(property: ItemProperty): boolean {
    return property && property.itemClassificationCode.listID === CUSTOM_PROPERTY_LIST_ID;
}

export function getPropertyValues(property: ItemProperty): any[] {
    switch(property.valueQualifier) {
        case "INT":
        case "DOUBLE":
        case "NUMBER":
        case "REAL_MEASURE":
            return property.valueDecimal;
        case "BINARY":
            return property.valueBinary;
        case "QUANTITY":
            return property.valueQuantity;
        case "STRING":
        case "BOOLEAN":
            return property.value;
    }
}

export function getPropertyValuesAsStrings(property: ItemProperty): string[] {
    switch(property.valueQualifier) {
        case "INT":
        case "DOUBLE":
        case "NUMBER":
        case "REAL_MEASURE":
            return property.valueDecimal.map(num => String(num));
        case "BINARY":
            return property.valueBinary.map(bin => bin.fileName);
        case "QUANTITY":
            return property.valueQuantity.map(qty => `${qty.value} ${qty.unitCode}`);
        case "STRING":
            if (property.value.length === 0)
                return [''];
            else
                return [property.value[0].value];
        case "BOOLEAN":
            if (property.value.length === 0)
                return ['false'];
            else
                return [property.value[0].value];
    }
}

export function isTransportService(product: CatalogueLine): boolean {
    return product && !!product.goodsItem.item.transportationServiceDetails;
}

export function deepEquals(obj1: any, obj2: any): boolean {
    if(obj1 === obj2) {
        return true;
    }

    // simple cases should be compared with obj1 === obj2
    // let's consider functions immutable here...
    if(typeof obj1 !== "object") {
        return false;
    }

    // array case
    if(Array.isArray(obj1)) {
        if(!Array.isArray(obj2)) {
            return false;
        }

        if(obj1.length !== obj2.length) {
            return false;
        }

        for(let i = 0; i < obj1.length; i++) {
            if(!deepEquals(obj1[i], obj2[i])) {
                return false;
            }
        }

        return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if(keys1.length !== keys2.length) {
        return false;
    }

    for(let i = 0; i < keys1.length; i++) {
        // obj2[keys1[i]] is NOT a mistake, keys may be ordered differently...
        if(!deepEquals(obj1[keys1[i]], obj2[keys1[i]])) {
            return false;
        }
    }

    return true;
}