import {Quantity} from "./quantity";
import {Item} from "./item";
import {Price} from "./price";
import {LineReference} from "./line-reference";
import {Period} from "./period";
import {DeliveryTerms} from "./delivery-terms";
import {Delivery} from "./delivery";

/**
 * Created by suat on 23-Aug-17.
 */
export class LineItem {
    constructor(
        public quantity:Quantity,
        public warrantyInformation:string[],
        public delivery:Delivery,
        public deliveryTerms:DeliveryTerms,
        public price:Price,
        public item:Item,
        public warrantyValidityPeriod:Period,
        public lineReference:LineReference[]
    ) {  }
}
