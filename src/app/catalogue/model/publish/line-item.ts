import {Quantity} from "./quantity";
import {Item} from "./item";
import {Price} from "./price";
import {LineReference} from "./line-reference";

/**
 * Created by suat on 23-Aug-17.
 */
export class LineItem {
    constructor(
        public quantity:Quantity,
        public price:Price,
        public item:Item,
        public lineReference:LineReference[]
    ) {  }
}
