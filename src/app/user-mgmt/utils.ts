import { Address } from "./model/address";

export function addressToString(address: Address): string {
    const num = address.buildingNumber ? " " + address.buildingNumber : "";
    const region = address.region ? " ("+address.region+")" : "";
    return `${address.streetName}${num}, ${address.postalCode} ${address.cityName}${region}, ${address.country}`;
}
