/**
 * Created by suat on 12-May-17.
 */

import {Price} from "./price";
import {Address} from "./address";
import {Package} from "./package";
import {AllowanceCharge} from "./allowance-charge";
import {Quantity} from './quantity';
import {TaxCategory} from "./tax-category";

export class ItemLocationQuantity {
    constructor(public minimumQuantity: Quantity = null,
                public applicableTerritoryAddress: Address[] = [],
                public price: Price = new Price(),
                public allowanceCharge: AllowanceCharge[] = [new AllowanceCharge()],
                public applicableTaxCategory: TaxCategory[] = [new TaxCategory()]) {
    }
}