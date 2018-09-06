import { Address } from "./model/address";

export function addressToString(address: Address): string {
    const num = address.buildingNumber ? " " + address.buildingNumber : "";
    return `${address.streetName}${num}, ${address.cityName} ${address.postalCode}, ${address.country}`;
}