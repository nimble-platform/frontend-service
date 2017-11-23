import {Item} from "./item";
import {Quantity} from "./quantity";
/**
 * Created by suat on 05-Oct-17.
 */
export class ReceiptLine {
    constructor(
        public rejectedQuantity: Quantity = new Quantity(),
        public rejectReason: string[] = [],
        public item:Item = null
    ) {  }
}
