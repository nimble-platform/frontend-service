import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { QuotationLine } from "./quotation-line";
import { DocumentReference } from "./document-reference";
import { Code } from "./code";
import { PaymentTerms } from "./payment-terms";
import { PaymentMeans } from "./payment-means";
import {Clause} from './clause';
/**
 * Created by suat on 17-Sep-17.
 */
export class Quotation {
    constructor(
        public id: string,
        public note: string[],
        public documentStatusCode: Code,
        public documentStatusReasonCode: Code,
        public lineCountNumeric: number,
        public dataMonitoringPromised: boolean,
        public requestForQuotationDocumentReference: DocumentReference,
        public buyerCustomerParty: CustomerParty,
        public sellerSupplierParty: SupplierParty,
        public quotationLine: QuotationLine[],
        public paymentMeans: PaymentMeans,
        public paymentTerms: PaymentTerms,
        public additionalDocumentReference:DocumentReference[] = [],
        public termOrCondition:Clause[] = []
    ) {}
}
