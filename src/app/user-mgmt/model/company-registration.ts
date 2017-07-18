import { Address } from './address';

export class CompanyRegistration {
    constructor(public userID: string,
                public companyID: string,
                public name: string,
                public address: Address) {
    }
}