import {Quantity} from "./quantity";
import {Text} from "./text";
import {Code} from './code';
export class MultiTypeValue {
    constructor(public name: Text = new Text(),
                public valueQualifier: string = 'QUANTITY', // could be STRING, NUMBER, QUANTITY or CODE
                public value: Text[] = [],
                public valueQuantity: Quantity[] = [],
                public valueDecimal: number[] = [],
                public valueCode: Code[] = []) {
    }
}