import {Code} from "./code";
/**
 * Created by deniz on 16/07/17.
 */

export class Package {
    constructor(
        public quantity: string, // TODO should have been QuantityType
        public packagingTypeCode: Code
        // TODO left hjid out?
    ) {  }
}