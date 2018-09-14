import {LineItem} from "./line-item";
import {SupplierParty} from "./supplier-party";
import {CustomerParty} from "./customer-party";
import {DocumentReference} from './document-reference';
export class Ppap{
    constructor(
        public id:string = null,
        public note: string[] = [''],
        public documentType:String[] = null,
        public buyerCustomerParty:CustomerParty = null,
        public sellerSupplierParty:SupplierParty = null,
        public lineItem:LineItem = null,
        public additionalDocumentReference:DocumentReference[] = []
    ){}
}
