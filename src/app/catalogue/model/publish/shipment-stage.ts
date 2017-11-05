import {Party} from "./party";
export class ShipmentStage {
    constructor(
        public estimatedDeliveryDate: string = null,
        public carrierParty: Party = new Party(),
    ) {  }
}