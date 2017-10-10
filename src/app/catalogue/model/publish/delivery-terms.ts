import {Amount} from "./amount";
import {Delivery} from "./delivery";
import {Period} from "./period";
/**
 * Created by deniz on 16/07/17.
 */

export class DeliveryTerms {
    constructor(
        public id: string,
        public estimatedDeliveryPeriod:Period,
        public specialTerms: string,
        public incoterms: string,
        public amount: Amount,
        public hjid: string
    ) {  }
}