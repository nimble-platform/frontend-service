/**
 * Created by suat on 12-May-17.
 */
import {Item} from "./item";
import {Delivery} from "./delivery";
import {DeliveryTerms} from "./delivery-terms";
import {Package} from "./package";

export class GoodsItem {
    constructor(
        public id: string,
        public item: Item,
        public containingPackage: Package,
        public deliveryTerms: DeliveryTerms
    ) {  }
}
