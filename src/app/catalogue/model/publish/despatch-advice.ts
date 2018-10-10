import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
import {Period} from "./period";
import {LineItem} from "./line-item";
import {OrderReference} from "./order-reference";
import {DespatchLine} from "./despatch-line";
import {CustomerParty} from "./customer-party";
import {SupplierParty} from "./supplier-party";
import {DocumentReference} from './document-reference';
/**
 * Created by suat on 05-Oct-17.
 */
export class DespatchAdvice {
    constructor(
        public id:string = null,
        public note:string[] = [''],
        public orderReference:OrderReference[] = [],
        public deliveryCustomerParty:CustomerParty = null,
        public despatchSupplierParty:SupplierParty = null,
        public despatchLine:DespatchLine[] = [],
        public additionalDocumentReference:DocumentReference[] = []
    ) {  }
}