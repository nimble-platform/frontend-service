import {Period} from "./period";
import {ItemProperty} from "./item-property";
import {ItemLocationQuantity} from "./item-location-quantity";
import {PaymentTerms} from "./payment-terms";
import {PaymentMeans} from "../../../user-mgmt/model/payment-means";
import {Quantity} from "./quantity";

export class PriceOption {
    constructor(
        public typeID: number = null,
        public incoterms: string[] = null,
        public estimatedDeliveryPeriod: Period= null,
        public additionalItemProperty: ItemProperty[] = null,
        public paymentMeans: PaymentMeans[] = null,
        public paymentTerms: PaymentTerms = null,
        public itemLocationQuantity:ItemLocationQuantity = new ItemLocationQuantity()
    ) {  }
}