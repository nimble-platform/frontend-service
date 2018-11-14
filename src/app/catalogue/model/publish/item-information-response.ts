import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { DocumentReference } from "./document-reference";
import { Item } from "./item";

export class ItemInformationResponse {
	constructor(
		public id:string = null,
		public note: string[] = [''],
		public itemInformationRequestDocumentReference:DocumentReference = new DocumentReference(),
		public buyerCustomerParty:CustomerParty = new CustomerParty(),
		public sellerSupplierParty:SupplierParty = new SupplierParty(),
		public item:Item[] = [new Item()],
        public additionalDocumentReference:DocumentReference[] = []
	) {  }
}