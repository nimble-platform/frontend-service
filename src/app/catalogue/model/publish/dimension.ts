import {Quantity} from "./quantity";
/**
 * Created by deniz on 16/07/17.
 */

export class Dimension {
    constructor(
        public attributeID: string,
        public measure: Quantity,
        public description: string[],
        public minimumMeasure: Quantity,
        public maximumMeasure: Quantity,
        public hjid: string
    ) {  }
}