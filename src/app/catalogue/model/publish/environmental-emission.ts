import {Code} from "./code";
import {Quantity} from "./quantity";
/**
 * Created by suat on 09-Nov-17.
 */
export class EnvironmentalEmission {
    constructor(
        public environmentalEmissionTypeCode:Code = new Code(),
        public valueMeasure:Quantity = new Quantity()
    ) { }
}