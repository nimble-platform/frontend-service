import { Address } from './address';
import { DeliveryTerms } from './delivery-terms';

export class CompanySettings {
    constructor(
        public address: Address,
        public deliveryTerms: DeliveryTerms,
    ) {  }
}