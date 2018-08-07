import { Address } from './address';
import { DeliveryTerms } from './delivery-terms';
import { PaymentMeans } from './payment-means';
import { Certificate } from './certificate';

export class CompanySettings {
    constructor(
        public name: string,
    		public vatNumber: string,
    		public verificationInformation: string,
    		public website: string,
        public ppapCompatibilityLevel: number,
        public address: Address,
        //public paymentMeans: PaymentMeans[],
        public deliveryTerms: DeliveryTerms[],
        public certificates: Certificate[]
    ) {  }
}
