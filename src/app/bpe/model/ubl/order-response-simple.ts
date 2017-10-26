import {Party} from "../../../catalogue/model/publish/party";
import {OrderReference} from "../order-reference";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
export class OrderResponseSimple {
	constructor(
		public note: string = null,
		public rejectionNode: string = null,
		public acceptedIndicator: boolean = null,
		public orderReference:OrderReference = null,
		public sellerSupplierParty: SupplierParty = null,
		public buyerCustomerParty: CustomerParty = null
	) {  }
}