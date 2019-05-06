import {Text} from "./text";
import {MultiTypeValue} from "./multi-type-value";

export class TradingTerm {
    constructor(
        public id:string = null,
        public description: Text[] = [],
        public tradingTermFormat:string = null,
        public value: MultiTypeValue = null,
    ) {  }

    getDescription(languageID: string): string {
        for (const pName of this.description) {
            if(pName.languageID === languageID) {
                return pName.value;
            }
        }
    }
}
