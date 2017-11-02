import {Amount} from "./amount";
import {Location} from "./location";
import {Period} from "./period";
/**
 * Created by deniz on 16/07/17.
 */

export class DeliveryTerms {
    constructor(
        public id: string = null,
        public estimatedDeliveryPeriod:Period = new Period(),
        public specialTerms: string = null,
        public incoterms: string = null,
        public amount: Amount = new Amount(),
        public deliveryLocation:Location = new Location(),
        public hjid: string = null
    ) {  }
}