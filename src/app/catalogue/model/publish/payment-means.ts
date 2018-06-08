import {Country} from "./country";
import {Code} from "./code";
import {FinancialAccount} from "./financial-account";

export class PaymentMeans {
    constructor(public paymentMeansCode: Code = new Code()) {
    }
}