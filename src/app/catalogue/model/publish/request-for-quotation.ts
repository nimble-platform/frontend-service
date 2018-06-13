import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {RequestForQuotationLine} from "../../../catalogue/model/publish/request-for-quotation-line";
import {Delivery} from "../../../catalogue/model/publish/delivery";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import {PaymentTerms} from './payment-terms';
import {PaymentMeans} from './payment-means';
export class RequestForQuotation {
	constructor(
		public id:string,
		public note: string[],
		public dataMonitoringRequested: boolean,
		public buyerCustomerParty:CustomerParty,
		public sellerSupplierParty:SupplierParty,
		public delivery:Delivery,
		public requestForQuotationLine:RequestForQuotationLine[],
		public paymentTerms:PaymentTerms,
		public paymentMeans:PaymentMeans
	) {  }
}