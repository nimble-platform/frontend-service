import {Quantity} from "./quantity";
/**
 * Created by deniz on 16/07/17.
 */

export class Dimension {
    constructor(
        public attributeID: string = null,
        public measure: Quantity = new Quantity(),
    ) {  }
}