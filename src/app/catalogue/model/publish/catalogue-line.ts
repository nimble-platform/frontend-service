import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
/**
 * Created by suat on 26-May-17.
 */
export class CatalogueLine {
    constructor(
        public hjid:string,
        public orderableUnit: string,
        public goodsItem:GoodsItem,
        public requiredItemLocationQuantity:ItemLocationQuantity
    ) {  }
}