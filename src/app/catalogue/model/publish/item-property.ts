/**
 * Created by suat on 12-May-17.
 */
import {ItemPropertyGroup} from "./item-property-group";
import {ItemPropertyRange} from "./item-property-range";
import {BinaryObject} from "./binary-object";
import {Code} from "./code";

export class ItemProperty {
    constructor(
        public id: string,
        public name: string,
        public value: string[],
        public valueDecimal: number[],
        public valueBinary:BinaryObject[],
        public demoSpecificMultipleContent:string,
        public unit: string,
        public valueQualifier: string,
        //public itemPropertyGroup: ItemPropertyGroup,
        public itemClassificationCode: Code,
	    public propertyDefinition: string,
        public itemPropertyRange: ItemPropertyRange
    ) {  }
}
