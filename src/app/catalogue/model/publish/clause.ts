import {Text} from './text';
import {TradingTerm} from './trading-term';

export class Clause {
    constructor(
        public id:string = null,
        public type:string = null,
        public content:Text[] = [],
        public tradingTerms:TradingTerm[] = []
    ) {  }
}