import {Quantity} from "./quantity";
import {Text} from "./text";
export class MultiTypeValue {
    constructor(public name: Text = new Text(),
                public valueQualifier: string = 'QUANTITY', // could be STRING, NUMBER or QUANTITY
                public value: Text[] = [],
                public valueQuantity: Quantity[] = [],
                public valueDecimal: number[] = []) {
    }
}