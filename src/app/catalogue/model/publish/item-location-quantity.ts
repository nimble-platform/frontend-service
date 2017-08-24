/**
 * Created by suat on 12-May-17.
 */

import {Price} from "./price";
import {Address} from "./address";
import {Package} from "./package";


// Class properties incomplete
export class ItemLocationQuantity {
    constructor(public price: Price,
                public applicableTerritoryAddress: Address,
                public _package: Package,
                public tradingRestrictions: string[]
                ) {
    }
}
