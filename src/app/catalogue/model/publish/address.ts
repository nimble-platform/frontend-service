import {AddressLine} from "./address-line";
import {Country} from "./country";
import {LocationCoordinate} from "./location-coordinate";
import {Code} from "./code";
/**
 * Created by deniz on 16/07/17.
 */

export class Address {
    constructor(
        public id:String,
        public addressTypeCode: Code,
        public addressFormatCode: Code,
        public postbox: string,
        public floor: string,
        public room: string,
        public streetName: string,
        public additionalStreetName: string,
        public blockName: string,
        public buildingName: string,
        public buildingNumber: string,
        public inhouseMail: string,
        public department: string,
        public citySubdivisionName: string,
        public cityName: string,
        public postalZone: string,
        public countrySubentity: string,
        public countrySubentityCode: Code,
        public region: string,
        public district: string,
        public addressLine: AddressLine[],
        public country: Country,
        public locationCoordinate: LocationCoordinate[],
        public hjid: string
        ) {  }
}