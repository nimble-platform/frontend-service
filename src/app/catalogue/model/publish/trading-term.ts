import {Text} from "./text";

export class TradingTerm {
    constructor(
        public id:string = null,
        public description: Text[] = [],
        public tradingTermFormat:string = null,
        public value:string [] = null
    ) {  }
}