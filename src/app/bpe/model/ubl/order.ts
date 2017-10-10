import {OrderLine} from "../../../catalogue/model/publish/order-line";
import {Party} from "../../../catalogue/model/publish/party";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
export class Order {
	constructor(
		public id:string,
		public note: string,
		public buyerCustomerParty:CustomerParty,
		public sellerSupplierParty:SupplierParty,
		public orderLine:OrderLine[]
	) {  }
}