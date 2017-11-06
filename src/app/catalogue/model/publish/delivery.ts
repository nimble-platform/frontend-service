import {Period} from "./period";
import {DeliveryTerms} from "./delivery-terms";
/**
 * Created by deniz on 16/07/17.
 */

export class Delivery {
    constructor(
        public requestedDeliveryPeriod: Period = new Period(),
        public deliveryTerms: DeliveryTerms = new DeliveryTerms()
    ) {  }
}