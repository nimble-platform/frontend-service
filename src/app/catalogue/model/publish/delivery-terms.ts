import {Amount} from "./amount";
import {Delivery} from "./delivery";
/**
 * Created by deniz on 16/07/17.
 */

export class DeliveryTerms {
    constructor(
        public id: string,
        public specialTerms: string,
        public amount: Amount,
        public delivery: Delivery,
        public hjid: string
    ) {  }
}