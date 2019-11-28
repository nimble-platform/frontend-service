import {Quantity} from '../catalogue/model/publish/quantity';
import {Address} from '../catalogue/model/publish/address';
import {TradingTerm} from '../catalogue/model/publish/trading-term';
import {Clause} from '../catalogue/model/publish/clause';

export class CommonTerms {
    constructor(
        public deliveryPeriod:Quantity,
        public warrantyPeriod:Quantity,
        public incoTerm:string,
        public paymentTerm:string,
        public paymentMean:string,
        public dataMonitoringRequested:boolean,
        public frameContractDuration: Quantity,
        public deliveryAddress: Address,
        public tradingTerms: TradingTerm[],
        public clauses: Clause[],
        public areDefaultTermsAndConditions:boolean // whether the clauses are the default ones of the platform or not
    ) {  }
}
