import { ItemProperty } from "../catalogue/model/publish/item-property";
import { Quantity } from "../catalogue/model/publish/quantity";
import { Period } from "../catalogue/model/publish/period";
import { Price } from "../catalogue/model/publish/price";
import { Category } from "../catalogue/model/category/category";
import { Property } from "../catalogue/model/category/property";
import { PropertyValueQualifier } from "../catalogue/model/publish/property-value-qualifier";
import { CUSTOM_PROPERTY_LIST_ID } from "../catalogue/model/constants";
import { CatalogueLine } from "../catalogue/model/publish/catalogue-line";
import {Amount} from "../catalogue/model/publish/amount";
import {CookieService} from "ng2-cookies";
import {Headers} from "@angular/http";
import { AbstractControl } from "@angular/forms";
declare var Countries: any;

const UI_NAMES: any = {
    STRING: "TEXT"
}

const COUNTRY_NAMES = getCountryNames();
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

export function getPropertyKey(property: Property | ItemProperty): string {
    if(isItemProperty(property)) {
        return property.name + "___" + property.valueQualifier;
    }
    // Property
    return property.preferredName + "___" + property.dataType;
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
    return categories.sort((a, b) => a.preferredName.localeCompare(b.preferredName));
}

export function sortProperties(properties: Property[]): Property[] {
    return properties.sort((a, b) => a.preferredName.localeCompare(b.preferredName));
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
        case "REAL_MEASURE":
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
        case "REAL_MEASURE":
        case "QUANTITY":
            return property.valueQuantity.map(qty => `${qty.value} ${qty.unitCode}`);
        case "STRING":
        case "BOOLEAN":
            return property.value;
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
