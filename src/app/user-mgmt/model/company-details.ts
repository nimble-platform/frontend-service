import { Address } from './address';

export class CompanyDetails {
    constructor(
      public address: Address,
      public businessKeywords: {},
      public businessType: string,
      public legalName: {},
      public industrySectors: string[],
      public vatNumber: string,
      public verificationInformation: string,
      public yearOfCompanyRegistration: number
    ) {  }
}
