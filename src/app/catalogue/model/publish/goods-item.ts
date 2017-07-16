/**
 * Created by suat on 12-May-17.
 */
import {Item} from "./item";
import {Delivery} from "./delivery";

export class GoodsItem {
    constructor(
        public id: string,
        public item: Item,
        public delivery: Delivery
    ) {  }
}
