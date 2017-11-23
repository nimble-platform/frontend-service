import {Code} from "./code";
import {CommodityClassification} from "./commodity-classification";
import {Dimension} from "./dimension";
import {Party} from "./party";
import {ShipmentStage} from "./shipment-stage";
import {EnvironmentalEmission} from "./environmental-emission";
import {ServiceFrequencyType} from "./service-frequency-type";
import {Period} from "./period";
/**
 * Created by suat on 07-Nov-17.
 */
export class TransportationService {
    constructor(
        public transportServiceCode:Code = new Code(),
        public name:string = null,
        public supportedCommodityClassification:CommodityClassification[] = [new CommodityClassification()],
        public totalCapacityDimension:Dimension = new Dimension(),
        public shipmentStage:ShipmentStage[] = [new ShipmentStage()],
        public environmentalEmission:EnvironmentalEmission[] = [new EnvironmentalEmission()],
        public estimatedDurationPeriod:Period = new Period(),
        public scheduledServiceFrequency:ServiceFrequencyType[] = [new ServiceFrequencyType()]
    ) { }
}