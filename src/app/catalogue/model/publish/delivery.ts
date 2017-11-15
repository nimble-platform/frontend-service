import {Period} from "./period";
import {DeliveryTerms} from "./delivery-terms";
import {Shipment} from "./shipment";
import {Address} from "./address";
/**
 * Created by deniz on 16/07/17.
 */

export class Delivery {
    constructor(
        public requestedDeliveryPeriod: Period = new Period(),
        public deliveryAddress:Address = new Address(),
        public deliveryTerms: DeliveryTerms = new DeliveryTerms(),
        public shipment: Shipment = new Shipment()
    ) {  }
}