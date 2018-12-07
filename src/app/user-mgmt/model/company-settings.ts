import { Certificate } from './certificate';
import { CompanyDescription } from './company-description';
import { CompanyDetails } from './company-details';
import { CompanyTradeDetails } from './company-trade-details';
import { CompanyNegotiationSettings } from './company-negotiation-settings';

export class CompanySettings {
    constructor(
        public certificates: Certificate[],
        public companyID: string,
        public description: CompanyDescription,
        public details: CompanyDetails,
        public preferredProductCategories: string[],
        public recentlyUsedProductCategories: string[],
        public tradeDetails: CompanyTradeDetails,
        public negotiationSettings: CompanyNegotiationSettings
    ) {  }
}
