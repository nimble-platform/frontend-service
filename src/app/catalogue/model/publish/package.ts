import {Code} from "./code";
import {Quantity} from "./quantity";
/**
 * Created by deniz on 16/07/17.
 */

export class Package {
    constructor(
        public quantity: Quantity,
        public packagingTypeCode: Code,
        public hjid: string
    ) {  }
}