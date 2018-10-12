import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { ItemInformationRequestLine } from "./item-information-request-line";
import {DocumentReference} from './document-reference';

export class ItemInformationRequest {
	constructor(
		public id:string = null,
		public note: string[] = [''],
		public buyerCustomerParty:CustomerParty = new CustomerParty(),
		public sellerSupplierParty:SupplierParty = new SupplierParty(),
		public itemInformationRequestLine:ItemInformationRequestLine[] = [new ItemInformationRequestLine()],
        public additionalDocumentReference:DocumentReference[] = []
	) {  }
}