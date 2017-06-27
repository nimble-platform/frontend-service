/**
 * Created by suat on 12-May-17.
 */
import {Item} from "./item";
import {Identifier} from "./identifier";

export class GoodsItem {
    constructor(
        public id: Identifier,
        public item: Item
    ) {  }
}
