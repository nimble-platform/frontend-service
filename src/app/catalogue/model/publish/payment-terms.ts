import { TradingTerm } from './trading-term';

export class PaymentTerms {
    constructor(public paymentConditions:string[] = null,
                public tradingTerms: TradingTerm[] = []) {
    }
}