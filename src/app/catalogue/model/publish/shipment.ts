import {ShipmentStage} from "./shipment-stage";
import {GoodsItem} from "./goods-item";
export class Shipment {
    constructor(
        public handlingInstructions: string = null,
        public goodsItem:GoodsItem = new GoodsItem(),
        public shipmentStage: ShipmentStage[] = [new ShipmentStage()]
    ) {  }
}