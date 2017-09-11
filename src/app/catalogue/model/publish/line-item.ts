import {Quantity} from "./quantity";
import {Item} from "./item";

/**
 * Created by suat on 23-Aug-17.
 */
export class LineItem {
    constructor(
        public quantity:Quantity,
        public item:Item
    ) {  }
}
