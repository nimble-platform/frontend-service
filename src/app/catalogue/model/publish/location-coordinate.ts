import {Code} from "./code";
import {Quantity} from "./quantity";
/**
 * Created by deniz on 16/07/17.
 */

export class LocationCoordinate {
    constructor(
        public coordinateSystemCode: Code,
        public latitudeDegreesMeasure: Quantity,
        public latitudeMinutesMeasure: Quantity,
        public latitudeDirectionCode: Code,
        public longitudeDegreesMeasure: Quantity,
        public longitudeMinutesMeasure: Quantity,
        public longitudeDirectionCode: Code,
        public altitudeMeasure: Quantity,
        public hjid: string
    ) {  }
}