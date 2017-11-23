import {OrderLine} from "../../../catalogue/model/publish/order-line";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {PaymentMeans} from "../../../catalogue/model/publish/payment-means";
import {Address} from "./address";
import {Period} from "./period";
import {ItemInformationRequestLine} from "./item-information-request-line";
import {DocumentReference} from "./document-reference";
import {Item} from "./item";
export class ItemInformationResponse {
	constructor(
		public id:string = null,
		public note: string[] = [''],
		public itemInformationRequestDocumentReference:DocumentReference = new DocumentReference(),
		public buyerCustomerParty:CustomerParty = new CustomerParty(),
		public sellerSupplierParty:SupplierParty = new SupplierParty(),
		public item:Item[] = [new Item()]
	) {  }
}