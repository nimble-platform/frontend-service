import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { RequestForQuotationLine } from "./request-for-quotation-line";
import { Delivery } from "./delivery";
import {DocumentReference} from './document-reference';

export class RequestForQuotation {
	constructor(
		public id: string,
		public note: string[] = [''],
		public buyerCustomerParty: CustomerParty,
		public sellerSupplierParty: SupplierParty,
		public delivery: Delivery,
		public requestForQuotationLine: RequestForQuotationLine[],
        public additionalDocumentReference:DocumentReference[] = []
	) {  }
}
