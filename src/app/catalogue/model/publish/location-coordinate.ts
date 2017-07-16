import {Code} from "./code";
/**
 * Created by deniz on 16/07/17.
 */

export class LocationCoordinate {
    constructor(
        public coordinateSystemCode: Code,
    public latitudeDegreesMeasure: string, // TODO should have been QuantityType
    public latitudeMinutesMeasure: string, // TODO should have been QuantityType
    public latitudeDirectionCode: Code,
    public longitudeDegreesMeasure: string, // TODO should have been QuantityType
    public longitudeMinutesMeasure: string, // TODO should have been QuantityType
    public longitudeDirectionCode: Code,
    public altitudeMeasure: string // TODO should have been QuantityType
   // TODO left hjid out?
    ) {  }
}