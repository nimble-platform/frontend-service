import {AddressLine} from "./address-line";
import {Country} from "./country";
import {LocationCoordinate} from "./location-coordinate";
import {Code} from "./code";
/**
 * Created by deniz on 16/07/17.
 */

export class Address {
    constructor(
        public cityName: string = '',
        public country: Country = new Country(),
        ) {  }
}