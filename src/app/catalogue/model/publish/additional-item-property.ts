/**
 * Created by suat on 12-May-17.
 */
import {ItemPropertyGroup} from "./item-property-group";
import {ItemPropertyRange} from "./item-property-range";
import {BinaryObject} from "./binary-object";

export class AdditionalItemProperty {
    constructor(
        public name: string,
        public value: string[],
        public embeddedDocumentBinaryObject:BinaryObject[],
        public unit: string,
        public valueQualifier: string,
        public itemPropertyGroup: ItemPropertyGroup,
        public itemPropertyRange: ItemPropertyRange
    ) {  }
}