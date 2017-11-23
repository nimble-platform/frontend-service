/**
 * Created by suat on 12-May-17.
 */
import {Item} from "./item";
import {Delivery} from "./delivery";
import {DeliveryTerms} from "./delivery-terms";
import {Package} from "./package";
import {UBLModelUtils} from "../ubl-model-utils";

export class GoodsItem {
    constructor(
        public id: string = null,
        public item: Item = UBLModelUtils.createItem(),
        public containingPackage: Package = new Package(),
        public deliveryTerms: DeliveryTerms = new DeliveryTerms()
    ) {  }
}
