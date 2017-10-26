import {OrderLine} from "../../../catalogue/model/publish/order-line";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {PaymentMeans} from "../../../catalogue/model/publish/payment-means";
export class Order {
	constructor(
		public id:string = null,
		public note: string = null,
		public buyerCustomerParty:CustomerParty = null,
		public sellerSupplierParty:SupplierParty = null,
		public paymentMeans:PaymentMeans = new PaymentMeans(),
		public orderLine:OrderLine[] = null
	) {  }
}