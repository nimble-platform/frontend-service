import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { RequestForQuotationLine } from "./request-for-quotation-line";
import { Delivery } from "./delivery";
import { NegotiationOptions } from "./negotiation-options";
import { PaymentTerms } from "./payment-terms";
import { PaymentMeans } from "./payment-means";
import {DocumentReference} from './document-reference';
import {Clause} from './clause';

export class RequestForQuotation {
	constructor(
		public id: string,
		public note: string[] = [''],
		public dataMonitoringRequested: boolean,
		public buyerCustomerParty: CustomerParty,
		public sellerSupplierParty: SupplierParty,
		public delivery: Delivery,
		public requestForQuotationLine: RequestForQuotationLine[],
		public negotiationOptions: NegotiationOptions,
		public paymentMeans: PaymentMeans,
		public paymentTerms: PaymentTerms,
        public additionalDocumentReference:DocumentReference[] = [],
		public termOrCondition: Clause[] = []
	) {  }
}
