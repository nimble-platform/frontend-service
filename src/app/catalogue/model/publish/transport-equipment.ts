import {Code} from "./code";
import {TransportMeans} from "./transport-means";
/**
 * Created by suat on 07-Nov-17.
 */
export class TransportEquipment {
    constructor(
        public transportEquipmentTypeCode:Code = new Code(),
        public humidityPercent:number = null,
        public refrigeratorIndicator:boolean = null,
        public characteristics:string = null
    ) { }
}