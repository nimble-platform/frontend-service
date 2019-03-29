import {Country} from "./country";
/**
 * Created by deniz on 16/07/17.
 */

export class Address {
    constructor(
        public cityName: string = '',
        public region: string = '',
        public postalZone: string = '',
        public buildingNumber: string = '',
        public streetName: string = '',
        public country: Country = new Country(),
        ) {  }
}
