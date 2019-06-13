import { TradingTerm } from './trading-term';

export class PaymentTerms {
    constructor(public tradingTerms: TradingTerm[] = []) {
    }
}