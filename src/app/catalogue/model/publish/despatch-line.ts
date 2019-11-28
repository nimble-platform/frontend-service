import {Item} from "./item";
import {Shipment} from "./shipment";
import {Quantity} from "./quantity";
import {OrderLineReference} from './order-line-reference';
/**
 * Created by suat on 05-Oct-17.
 */
export class DespatchLine {
    constructor(
        public deliveredQuantity:Quantity = new Quantity(),
        public item:Item = null,
        public shipment:Shipment[] = [],
        public orderLineReference:OrderLineReference = null
    ) {  }
}
