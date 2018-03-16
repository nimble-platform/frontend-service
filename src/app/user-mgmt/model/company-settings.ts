import { Address } from './address';
import { DeliveryTerms } from './delivery-terms';
import { PaymentMeans } from './payment-means';

export class CompanySettings {
    constructor(
        public name: string,
		public vatNumber: string,
		public verificationInformation: string,
		public website: string,
        public address: Address,
        public paymentMeans: PaymentMeans,
        public deliveryTerms: DeliveryTerms,
    ) {  }
}
