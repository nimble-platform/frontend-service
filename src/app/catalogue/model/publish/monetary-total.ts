import {Amount} from "./amount";

export class MonetaryTotal {
    constructor(
        public payableAmount: Amount = new Amount()) {  }
}