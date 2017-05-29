import {GoodsItem} from "./goods-item";
/**
 * Created by suat on 26-May-17.
 */
export class CatalogueLine {
    constructor(
        public orderableUnit: string,
        public goodsItem:GoodsItem
    ) {  }
}