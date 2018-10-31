import { Address } from './address';

export class CompanyEvent {
    constructor(
      public dateFrom: string,
      public dateTo: string,
      public description: string,
      public name: string,
      public place: Address
    ) {  }
}
