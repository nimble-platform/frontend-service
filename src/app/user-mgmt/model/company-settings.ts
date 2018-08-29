import { Address } from './address';
import { DeliveryTerms } from './delivery-terms';
import { Certificate } from './certificate';
import { CompanyNegotiationSettings } from './company-negotiation-settings';

export class CompanySettings {
    constructor(
        public name: string,
    		public vatNumber: string,
    		public verificationInformation: string,
    		public website: string,
            public ppapCompatibilityLevel: number,
            public address: Address,
            public deliveryTerms: DeliveryTerms[],
            public certificates: Certificate[],
            public preferredProductCategories: string[],
            public recentlyUsedProductCategories: string[],
            public negotiationSettings: CompanyNegotiationSettings,
    ) {  }
}
