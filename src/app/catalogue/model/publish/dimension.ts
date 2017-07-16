/**
 * Created by deniz on 16/07/17.
 */

export class Dimension {
    constructor(
        public attributeID: string,
        public measure: string, // TODO should have been QuantityType
        public description: string[],
        public minimumMeasure: string, // TODO should have been QuantityType
        public maximumMeasure: string // TODO should have been QuantityType
        // TODO left hjid out?
    ) {  }
}