import { Address } from './address';

export class CompanyDetails {
    constructor(
      public address: Address,
      public businessKeywords: {},
      public businessType: string,
      public legalName: {},
      public brandName: {},
      public industrySectors: {},
      public vatNumber: string,
      public verificationInformation: string,
      public yearOfCompanyRegistration: number
    ) {  }
}
