import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
import {Period} from "./period";
import {LineItem} from "./line-item";
import {OrderReference} from "./order-reference";
import {DespatchLine} from "./despatch-line";
import {DocumentReference} from "./document-reference";
import {ReceiptLine} from "./receipt-line";
import {SupplierParty} from "./supplier-party";
import {CustomerParty} from "./customer-party";
/**
 * Created by suat on 05-Oct-17.
 */
export class ReceiptAdvice {
    constructor(
        public id: string = null,
        public note:string[] = [""],
        public orderReference:OrderReference[] = null,
        public despatchDocumentReference:DocumentReference[] = null,
        public deliveryCustomerParty:CustomerParty = null,
        public despatchSupplierParty:SupplierParty = null,
        public receiptLine:ReceiptLine[] = null,
        public additionalDocumentReference:DocumentReference[] = []
    ) {  }
}