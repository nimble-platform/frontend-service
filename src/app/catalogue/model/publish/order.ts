import {OrderLine} from "../../../catalogue/model/publish/order-line";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {PaymentMeans} from "../../../catalogue/model/publish/payment-means";
import {Address} from "./address";
import {Period} from "./period";
import {PaymentTerms} from './payment-terms';
export class Order {
	constructor(
		public id:string = null,
		public note: string = null,
		public requestedDeliveryPeriod:Period = new Period(),
		public deliveryAddress: Address = new Address(),
		public buyerCustomerParty:CustomerParty = null,
		public sellerSupplierParty:SupplierParty = null,
		public paymentMeans:PaymentMeans = new PaymentMeans(),
		public paymentTerms:PaymentTerms = new PaymentTerms(),
		public orderLine:OrderLine[] = null
	) {  }
}