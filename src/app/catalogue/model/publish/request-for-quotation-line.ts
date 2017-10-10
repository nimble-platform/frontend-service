import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
import {Period} from "./period";
import {LineItem} from "./line-item";
/**
 * Created by suat on 17-Sep-17.
 */
export class RequestForQuotationLine {
    constructor(
        public lineItem:LineItem
    ) {  }
}