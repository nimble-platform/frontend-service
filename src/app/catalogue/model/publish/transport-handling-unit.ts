import {Code} from "./code";
import {Dimension} from "./dimension";
/**
 * Created by suat on 15-Nov-17.
 */
export class TransportHandlingUnit {
    constructor(public transportHandlingUnitTypeCode: Code = new Code(),
                public measurementDimension:Dimension[] = []) {
    }
}