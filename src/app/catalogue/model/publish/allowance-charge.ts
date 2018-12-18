import {Quantity} from "./quantity";
import {Amount} from "./amount";
/**
 * Created by suat on 28-Aug-18.
 */
export class AllowanceCharge {
    constructor(
        public amount: Amount = new Amount(),
        public perUnitAmount: Amount = new Amount()
    ) {  }
}
