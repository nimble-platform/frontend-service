/**
 * Created by suat on 12-May-17.
 */
import {Item} from "./item";
import {DeliveryTerms} from "./delivery-terms";
import {Package} from "./package";
import {UBLModelUtils} from "../ubl-model-utils";
import {Quantity} from './quantity';

export class GoodsItem {
    constructor(
        public id: string = null,
        public quantity: Quantity = new Quantity(),
        public item: Item = UBLModelUtils.createItem(),
        public containingPackage: Package = new Package(),
        public deliveryTerms: DeliveryTerms = new DeliveryTerms(),
        public sequenceNumberID:string = null,
        public grossWeightMeasure:Quantity = new Quantity(),
        public grossVolumeMeasure:Quantity = new Quantity()
    ) {  }
}
