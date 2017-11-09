import {Party} from "./party";
import {Code} from "./code";
export class ShipmentStage {
    constructor(
        public transportModeCode:Code = new Code(),
        public carrierParty: Party = new Party(),
    ) {  }
}