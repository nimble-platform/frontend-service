import {TradingTerm} from "./trading-term";
export class Clause {
    constructor(
        public id:string = null,
        public type:string = null,
        public tradingTerms: TradingTerm[] = []
    ) {  }
}