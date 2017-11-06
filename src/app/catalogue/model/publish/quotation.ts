import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {Delivery} from "../../../catalogue/model/publish/delivery";
import {QuotationLine} from "../../../catalogue/model/publish/quotation-line";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
/**
 * Created by suat on 17-Sep-17.
 */
export class Quotation {
    constructor(
        public id:string,
        public note: string[],
        public lineCountNumeric: number,
        public requestForQuotationDocumentReference:DocumentReference,
        public buyerCustomerParty:CustomerParty,
        public sellerSupplierParty:SupplierParty,
        public delivery:Delivery,
        public quotationLine:QuotationLine[]
    ) {  }
}