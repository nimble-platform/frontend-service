import {ShipmentStage} from "./shipment-stage";
import {GoodsItem} from "./goods-item";
import {Address} from "./address";
import {TransportHandlingUnit} from "./transport-handling-unit";
import {Quantity} from "./quantity";
import {Consignment} from "./consignment";
export class Shipment {
    constructor(
        public handlingInstructions: string = null,
        public totalTransportHandlingUnitQuantity: Quantity = new Quantity(),
        public consignment: Consignment[] = [new Consignment()],
        public goodsItem:GoodsItem[] = [new GoodsItem()],
        public shipmentStage: ShipmentStage[] = [new ShipmentStage()],
        public transportHandlingUnit: TransportHandlingUnit[] = [new TransportHandlingUnit()],
        public originAddress: Address = new Address(),
    ) {  }
}