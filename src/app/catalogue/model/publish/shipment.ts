import {Code} from "./code";
import {Party} from "./party";
import {DocumentReference} from "./document-reference";
import {ShipmentStage} from "./shipment-stage";
export class Shipment {
    constructor(
        public handlingInstructions: string = null,
        public shipmentStage: ShipmentStage[] = [new ShipmentStage()]
    ) {  }
}