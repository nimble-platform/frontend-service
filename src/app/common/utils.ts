import { ItemProperty } from "../catalogue/model/publish/item-property";

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