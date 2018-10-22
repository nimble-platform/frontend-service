import { Address } from './address';
import { CompanySettings } from './company-settings';

export class CompanyRegistration {
    constructor(public userID: string,
                public companyID: string,
                public settings: CompanySettings) {
    }
}
