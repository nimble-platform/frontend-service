import {Quantity} from "./quantity";
import {Text} from "./text";
export class MultiTypeValue {
    constructor(public name: Text = new Text(),
                public valueQualifier: string = 'QUANTITY',
                public value: Text = new Text(),
                public valueQuantity: Quantity = new Quantity()) {
    }
}