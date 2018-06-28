import { ItemProperty } from "../catalogue/model/publish/item-property";
import { Quantity } from "../catalogue/model/publish/quantity";
import { Period } from "../catalogue/model/publish/period";
import { Price } from "../catalogue/model/publish/price";

const UI_NAMES: any = {
    STRING: "TEXT"
}

export function toUIString(dataType: string): string {
    if(UI_NAMES[dataType]) {
        return UI_NAMES[dataType]
    }
    return dataType;
}

export function sanitizePropertyName(name: string): string {
    if(!name || name.length === 0) {
        return "";
    }
    const result = name.replace(/([a-z])([A-Z])/g, '$1 $2');
    return result.substr(0, 1).toUpperCase() + result.substr(1);
}

export function copy<T = any>(object: T): T {
    return JSON.parse(JSON.stringify(object));
}

export function getPropertyKey(property: ItemProperty): string {
    return property.name + "___" + property.valueQualifier;
}

export function quantityToString(quantity: Quantity): string {
    return `${quantity.value} ${quantity.unitCode}`;
}

export function durationToString(duration: Quantity): string {
    if(duration.value > 0) {
        return quantityToString(duration);
    }
    return "None";
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