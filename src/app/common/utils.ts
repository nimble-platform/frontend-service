import { ItemProperty } from "../catalogue/model/publish/item-property";
import { Quantity } from "../catalogue/model/publish/quantity";
import { Period } from "../catalogue/model/publish/period";
import { Price } from "../catalogue/model/publish/price";
import { Category } from "../catalogue/model/category/category";
import { Property } from "../catalogue/model/category/property";
import { PropertyValueQualifier } from "../catalogue/model/publish/property-value-qualifier";
import {CUSTOM_PROPERTY_LIST_ID, DEFAULT_LANGUAGE} from '../catalogue/model/constants';
import {Item} from '../catalogue/model/publish/item';
import {Text} from '../catalogue/model/publish/text';
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import {Amount} from "../catalogue/model/publish/amount";
import {CookieService} from "ng2-cookies";
import {Headers} from "@angular/http";
import {PartyName} from '../catalogue/model/publish/party-name';

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
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishName = null;
    for (let pName of cp.preferredName) {
        if(pName.languageID === defaultLanguage) {
            return pName.value;
        }
        else if(pName.languageID == "en"){
            englishName = pName.value;
        }
    }

    if(englishName){
        return englishName;
    }

    return cp.preferredName[0].value;
}

// if there is a value for the default language of the browser, it is returned
// if there is an english value, it is returned
// otherwise, the first one is returned
export function selectPreferredValue(texts:Text[]): string{
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishName = null;
    for (let text of texts) {
        if(text.languageID === defaultLanguage) {
            return text.value;
        }
        else if(text.languageID == "en"){
            englishName = text.value;
        }
    }

    if(englishName){
        return englishName;
    }

    if (texts.length === 0)
        return '';

    return texts[0].value;
}

export function selectName (ip: ItemProperty | Item) {
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishName = null;
    for (let pName of ip.name) {
        if(pName.languageID === defaultLanguage) {
            return pName.value;
        }
        else if(pName.languageID == "en"){
            englishName = pName.value;
        }
    }

    if(englishName){
        return englishName;
    }

    if (ip.name.length === 0)
        return '';

    return ip.name[0].value;
}

// textObject represents an object which contains languageId-value pairs
// this function is used to get value according to the default language of browser
export function selectValueOfTextObject(textObject): string{
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishName = null;
    // get the keys
    let keys = Object.keys(textObject);
    for(let key of keys){
        // if there is a value for the default language, simply return it
        if(key == defaultLanguage){
            return textObject[defaultLanguage];
        }
        else if(key == "en"){
            englishName = textObject[key];
        }
    }
    // if there's no value for default language, but an english value is available, then return it
    if(englishName){
        return englishName;
    }
    // if there's no value for default language and english, then return the first value if possible
    if(keys.length > 0){
        return textObject[keys[0]];
    }
    // if it is an empty object, return empty string.
    return "";
}

// for the given value, it creates a languageId-value pair.
// for now, languageId is the default language of the browser
export function createTextObject(value:string):Object{
    let defaultLanguage = DEFAULT_LANGUAGE();
    let textObject = {};
    textObject[defaultLanguage] = value;
    return textObject;
}

// For the given PartyName array, it finds the correct name of the party according to the default language of the browser.
export function selectPartyName(partyNames:PartyName[]):string{
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishName = null;
    for(let partyName of partyNames){
        // if the party has a name for the default language of the browser, return it
        if(partyName.name.languageID == defaultLanguage){
            return partyName.name.value;
        }
        else if(partyName.name.languageID == "en"){
            englishName = partyName.name.value;
        }
    }
    // if the party does not have a name for the default language of the browser, but english name is available, then return it
    if(englishName){
        return englishName;
    }
    // if there's no value for default language and english, then return the first value if possible
    if(partyNames.length > 0){
        return partyNames[0].name.value;
    }
    // if the party has no names, return empty string
    return "";
}

export function createText (value: string): Text {
    let language = DEFAULT_LANGUAGE();
    return new Text(value, language);
}

export function selectDescription (item:  Item) {
    if(item.description.length == 0){
        return null;
    }
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishName = null;
    for (let pName of item.description) {
        if(pName.languageID === defaultLanguage) {
            return pName.value;
        }
        else if(pName.languageID == "en"){
            englishName = pName.value;
        }
    }

    if(englishName)
        return englishName;

    return item.description[0].value;
}

export function selectItemPropertyValuesAsString (ip: ItemProperty, language: string): string[] {
    if (language === null)
        language = DEFAULT_LANGUAGE();
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
    return categories.sort((a, b) => selectPreferredName(a).localeCompare(selectPreferredName(b)));
}

export function sortProperties(properties: Property[]): Property[] {
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
            // if (property.value.length === 0)
            //     return [''];
            // else
            //     return [property.value[0].value];
            return [selectPreferredValue(property.value)];
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

export function getAuthorizedHeaders(cookieService: CookieService): Headers {
    const token = 'Bearer '+cookieService.get("bearer_token");
    const headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': token});
    return headers;
}