import { DeliveryTerms } from './delivery-terms';
import { PaymentMeans }from './payment-means';

export class CompanyTradeDetails {
    constructor(
      public deliveryTerms: DeliveryTerms[],
      public paymentMeans: PaymentMeans[],
      public ppapCompatibilityLevel: number
    ) {  }
}
