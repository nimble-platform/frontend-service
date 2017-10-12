import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
import {Period} from "./period";
import {LineItem} from "./line-item";
import {OrderReference} from "../../../bpe/model/order-reference";
import {DespatchLine} from "./despatch-line";
import {CustomerParty} from "./customer-party";
import {SupplierParty} from "./supplier-party";
/**
 * Created by suat on 05-Oct-17.
 */
export class DespatchAdvice {
    constructor(
        public id:string = null,
        public note:string[] = null,
        public orderReference:OrderReference[] = null,
        public deliveryCustomerParty:CustomerParty = null,
        public despatchSupplierParty:SupplierParty = null,
        public despatchLine:DespatchLine[] = null
    ) {  }
}