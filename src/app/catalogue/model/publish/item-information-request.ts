import {OrderLine} from "../../../catalogue/model/publish/order-line";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {PaymentMeans} from "../../../catalogue/model/publish/payment-means";
import {Address} from "./address";
import {Period} from "./period";
import {ItemInformationRequestLine} from "./item-information-request-line";
export class ItemInformationRequest {
	constructor(
		public id:string = null,
		public note: string[] = [''],
		public buyerCustomerParty:CustomerParty = new CustomerParty(),
		public sellerSupplierParty:SupplierParty = new SupplierParty(),
		public itemInformationRequestLine:ItemInformationRequestLine[] = [new ItemInformationRequestLine()]
	) {  }
}