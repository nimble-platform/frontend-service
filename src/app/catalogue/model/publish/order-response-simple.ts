import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {OrderReference} from "./order-reference";
export class OrderResponseSimple {
	constructor(
		public id: string = null,
		public note: string = null,
		public rejectionNote: string = null,
		public acceptedIndicator: boolean = null,
		public orderReference:OrderReference = null,
		public sellerSupplierParty: SupplierParty = null,
		public buyerCustomerParty: CustomerParty = null
	) {  }
}