import {OrderLine} from "../../../catalogue/model/publish/order-line";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {PaymentMeans} from "../../../catalogue/model/publish/payment-means";
import {Address} from "./address";
import {Period} from "./period";
import {Contract} from "./contract";
import {PaymentTerms} from './payment-terms';
import {MonetaryTotal} from "./monetary-total";
export class Order {
	constructor(
		public id:string = null,
		public note: string = null,
		public requestedDeliveryPeriod:Period = new Period(),
		public deliveryAddress: Address = new Address(),
		public contract: Contract[] = null,
		public buyerCustomerParty:CustomerParty = null,
		public sellerSupplierParty:SupplierParty = null,
		public paymentMeans?: string,
		public paymentTerms?: string,
		public anticipatedMonetaryTotal: MonetaryTotal = new MonetaryTotal(),
		public orderLine:OrderLine[] = null
	) {  }
}
