import {Quantity} from "./quantity";
import {Shipment} from "./shipment";
/**
 * Created by suat on 10-Nov-17.
 */
export class Consignment {
    constructor(public grossWeightMeasure: Quantity = new Quantity(),
                public grossVolumeMeasure: Quantity = new Quantity(),
                public consolidatedShipment: Shipment[] = []) {
    }
}