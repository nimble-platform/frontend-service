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
import { AbstractControl } from "@angular/forms";
declare var Countries: any;
import {PartyName} from '../catalogue/model/publish/party-name';
import {deliveryPeriodUnitListId, maximumDecimalsForPrice, warrantyPeriodUnitListId} from  './constants'
import {UnitService} from "./unit-service";
import {CompanyNegotiationSettings} from "../user-mgmt/model/company-negotiation-settings";

const UI_NAMES: any = {
    STRING: "TEXT"
}

export const COUNTRY_NAMES = getCountryNames();
const COUNTRY_JSON = getCountryJSON();

function getCountryNames(): string[] {
  var countriesFull = Countries.countries;
  var countryList = [];
  for (let country in countriesFull) {
    countryList.push(countriesFull[country]["name"]);
  }
  countryList.sort();
  return countryList;
}

function getCountryJSON(): any[] {
  var countriesFull = Countries.countries;
  var countryList = [];
  for (let country in countriesFull) {
    countryList.push({
      "iso":country,
      "name":countriesFull[country]["name"],
      "alt":countriesFull[country]["native"]
    });
  }
  return countryList;
}

export function getCountryByISO(term: string): string {
  var country = "";
  if (term.length == 2) {
    for (var i=0; i<COUNTRY_JSON.length; i++) {
      if (COUNTRY_JSON[i].iso.toLowerCase() == term.toLowerCase())
        country = COUNTRY_JSON[i].name;
    }
  }
  return country;
}

export function getCountrySuggestions(term: string): string[] {
  var suggestionList = [];
  var suggestions = [];
  if (term != "") {
    for (var i=0; i<COUNTRY_JSON.length; i++) {
      var prob = 0;
      if (term.length == 2) {
        if (COUNTRY_JSON[i].iso.toLowerCase() == term.toLowerCase())
          prob = 1;
      }
      if (prob < 1) {
        if (COUNTRY_JSON[i].name.toLowerCase() == term.toLowerCase())
          prob = 1;
        else if (COUNTRY_JSON[i].alt.toLowerCase() == term.toLowerCase())
          prob = 1;
        else if (COUNTRY_JSON[i].name.toLowerCase().indexOf(term.toLowerCase()) == 0)
          prob = 0.9;
        else if (COUNTRY_JSON[i].alt.toLowerCase().indexOf(term.toLowerCase()) == 0)
          prob = 0.8;
        else if (COUNTRY_JSON[i].name.toLowerCase().indexOf(term.toLowerCase()) != -1)
          prob = 0.7;
        else if (COUNTRY_JSON[i].alt.toLowerCase().indexOf(term.toLowerCase()) != -1)
          prob = 0.6;
      }
      if (prob > 0) {
        suggestions.push({
          "prob": prob,
          "text": COUNTRY_JSON[i].name
        });
      }
    }
    suggestions = suggestions.sort(function(a,b){
        let a_comp = a.prob;
        let b_comp = b.prob;
        return b_comp-a_comp;
    });
    for (var i=0; i<Math.min(suggestions.length,10); i++) {
      suggestionList.push(suggestions[i].text);
    }
  }
  return suggestionList;
}

export function validateCountry(control: AbstractControl): any {
  var match = (COUNTRY_NAMES.indexOf(control.value) != -1);
  if (!match) {
    return { invalidCountry: true };
  }
  return null;
}

export function sanitizeLink(link: any): any {
  let parsed_link = "";
  if (link && link != "") {
    if (link.indexOf("http://") == -1 && link.indexOf("https://") == -1) {
      parsed_link = "http://"+link;
    }
    else {
      parsed_link = link;
    }
    if (!checkURL(parsed_link))
      parsed_link = "";
  }
  return parsed_link;
}

function checkURL(url: string): boolean {
  var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  var regex = new RegExp(expression);
  var match = false;
  if (url.match(regex))
    match = true;
  return match;
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

/**
 * label object in the form of:
 * {
 *    "en": "English label",
 *    "es": "Spanish label"
 * }
 *
 * tries first to get label in the preferred language, then English label, then the first label.
 * If the label is not a json object, then the label itself is returned
 * @param label
 */
export function selectNameFromLabelObject(label: any): string {
    if(label == null) {
        return "";
    }
    let defaultLanguage = DEFAULT_LANGUAGE();
    if(label[defaultLanguage] != null) {
        return label[defaultLanguage];
    }
    if(label["en"] != null) {
        return label["en"];
    }
    if(Object.keys.length > 0) {
        return label[Object.keys(label)[0]];
    } else {
        return label;
    }
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

// returns the all values for the default language of the browser
// if there's no value for the defualt language of the browser, then returns english values if possible
export function selectPreferredValues(texts:Text[]): string[]{
    let values = [];
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishValues = [];
    for (let text of texts) {
        if(text.languageID === defaultLanguage) {
            values.push(text.value);
        }
        else if(text.languageID == "en"){
            englishValues.push(text.value);
        }
    }
    // there are values for the default language of the browser
    if(values.length > 0){
        return values;
    }
    // there are english values
    if(englishValues.length > 0){
        return englishValues;
    }

    if (texts.length > 0 && texts[0].value)
      return [texts[0].value];
    else
      return [''];
}

// return the value for the default language of the browser
export function selectPreferredValue(texts:Text[]):string{
    let defaultLanguage = DEFAULT_LANGUAGE();
    let englishValue = null;
    for (let text of texts) {
        if(text.languageID === defaultLanguage) {
            return text.value;
        }
        else if(text.languageID == "en"){
            englishValue = text.value;
        }
    }
    // there is an english value
    if(englishValue){
        return englishValue;
    }

    if (texts.length > 0 && texts[0].value)
      return texts[0].value;
    else
      return '';
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

export function getFileExtension(filename: string): string {
    let ext = /^.+\.([^.]+)$/.exec(filename);
    return ext == null ? "" : ext[1];
}

export function roundToTwoDecimals(value): any{
    if (!isNaN(value) && value !== null) {
        return (Math.round(parseFloat(value) * 100) / 100).toFixed(2);
    }
    return value;
}

export function isNaNNullAware(number: number): boolean {
    if (isNaN(number) || number == null) {
        return true;
    }
    return false;
}

export function isValidPrice(value: any, maximumDecimals: number = maximumDecimalsForPrice ) {
    if (value != null && !isNaN(value) && value !== "") {
        let decimals = countDecimals(value);
        return (decimals <= maximumDecimals);
    }else {
        return false;
    }
}

export function countDecimals(value : any): number{
    if(Math.floor(value) === value) return 0;
    return value.toString().split(".")[1].length || 0;
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
    if (document.getElementById(divId))
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
            return property.valueDecimal.map(num => String(num));
        case "BINARY":
            return property.valueBinary.map(bin => bin.fileName);
        case "QUANTITY":
            return property.valueQuantity.map(qty => `${qty.value} ${qty.unitCode}`);
        case "STRING":
            return selectPreferredValues(property.value);
        case "BOOLEAN":
            if (property.value.length === 0)
                return ['false'];
            else
                return [property.value[0].value];
    }
}

export function isTransportService(product: CatalogueLine): boolean {
    if(product){
        for(let commodityClassification of product.goodsItem.item.commodityClassification){
            if(commodityClassification.itemClassificationCode.listID == "Default" && commodityClassification.itemClassificationCode.value == "Transport Service"){
                    return true;
            }
        }
    }
    return false;
}

export function isLogisticsService(product: CatalogueLine): boolean {
    if(product){
        for(let commodityClassification of product.goodsItem.item.commodityClassification){
            if(commodityClassification.itemClassificationCode.listID == "Default"){
                if(commodityClassification.itemClassificationCode.value == "Logistics Service" || commodityClassification.itemClassificationCode.value == "Transport Service"){
                    return true;
                }
            }

        }
    }
    return false;
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

export function removeHjids(json): any {
    let ret = JSON.parse(JSON.stringify(json));
    let keys = Object.keys(ret);
    for (let i=0; i<keys.length; i++) {
      if (keys[i] == "hjid")
        ret[keys[i]] = null;
      else if (ret[keys[i]] && typeof(ret[keys[i]]) === "object") {
        let keys_inner = Object.keys(ret[keys[i]]);
        if (keys_inner.length > 0)
          ret[keys[i]] = this.removeHjids(ret[keys[i]]);
      }
    }
    return ret;
}

export function getAuthorizedHeaders(cookieService: CookieService): Headers {
    const token = 'Bearer '+cookieService.get("bearer_token");
    const headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': token});
    return headers;
}
