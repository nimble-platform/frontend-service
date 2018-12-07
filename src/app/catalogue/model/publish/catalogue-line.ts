import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
import {Period} from "./period";
import {PriceOption} from "./price-option";
/**
 * Created by suat on 26-May-17.
 */
export class CatalogueLine {
    constructor(
        public id:string,
        public hjid:string,
        public orderableUnit: string,
        public freeOfChargeIndicator: boolean = null,
        public warrantyValidityPeriod: Period,
        public warrantyInformation: string[],
        public requiredItemLocationQuantity: ItemLocationQuantity,
        public priceOption: PriceOption[] = null,
        public goodsItem:GoodsItem
    ) {  }
}
