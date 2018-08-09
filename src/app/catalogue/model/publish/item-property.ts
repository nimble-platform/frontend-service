/**
 * Created by suat on 12-May-17.
 */
import { BinaryObject } from "./binary-object";
import { Code } from "./code";
import { Quantity } from "./quantity";
import { PropertyValueQualifier } from "./property-value-qualifier";
import {Text} from "./text";

export class ItemProperty {
    constructor(
        public id: string,
        public name: Text[] = [],
        // value bir dil icin birden fazla deger olabilir. Yani su sekilde olacak (ornegin name = [ color , renk ]):
        // value = [ tr:kirmizi, tr:mavi, en:red, en: blue ]
        public value: Text[] = [],
        public valueDecimal: number[],
        public valueQuantity: Quantity[],
        public valueBinary: BinaryObject[],
        public valueQualifier: PropertyValueQualifier,
        public itemClassificationCode: Code,
        public uri: string
    ) {  }
}
