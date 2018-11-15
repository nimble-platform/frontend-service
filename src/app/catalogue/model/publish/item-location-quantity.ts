/**
 * Created by suat on 12-May-17.
 */

import {Price} from "./price";
import {Address} from "./address";
import {Package} from "./package";
import {AllowanceCharge} from "./allowance-charge";
import {Quantity} from './quantity';

export class ItemLocationQuantity {
    constructor(public price: Price = new Price(),
                public applicableTerritoryAddress: Address[] = [],
                public allowanceCharge: AllowanceCharge[] = [new AllowanceCharge()],
                public minimumQuantity: Quantity = null,) {
    }
}
