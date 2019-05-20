import {Quantity} from "./quantity";

export class MultiValuedDimension {
    constructor(
        public attributeID: string = null,
        public measure: Quantity[] = [],
    ) {  }
}