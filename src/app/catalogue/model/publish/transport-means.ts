import {Code} from "./code";
import {TransportEquipment} from "./transport-equipment";
/**
 * Created by suat on 09-Nov-17.
 */
export class TransportMeans {
    constructor(public transportMeansTypeCode: Code = new Code(),
                public transportEquipment: TransportEquipment[] = [new TransportEquipment()]) {
    }
}