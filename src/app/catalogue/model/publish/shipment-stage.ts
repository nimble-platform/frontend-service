import {Party} from "./party";
import {Code} from "./code";
import {TransportMeans} from "./transport-means";
export class ShipmentStage {
    constructor(
        public transportModeCode:Code = new Code(),
        public carrierParty: Party = new Party(),
        public transportMeans:TransportMeans = new TransportMeans(),
        public estimatedDeliveryDate:string = null
    ) {  }
}