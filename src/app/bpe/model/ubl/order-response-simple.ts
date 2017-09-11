import {Party} from "../../../catalogue/model/publish/party";
import {OrderReference} from "../order-reference";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
export class OrderResponseSimple {
	constructor(
		public note: string,
		public acceptedIndicator: boolean,
		public orderReference:OrderReference,
		public sellerSupplierParty: SupplierParty,
		public buyerCustomerParty: CustomerParty
	) {  }
}