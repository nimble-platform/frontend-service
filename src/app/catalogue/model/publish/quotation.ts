import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { QuotationLine } from "../../../catalogue/model/publish/quotation-line";
import { DocumentReference } from "../../../catalogue/model/publish/document-reference";
import { Code } from "./code";
import { PaymentTerms } from "./payment-terms";
import { PaymentMeans } from "./payment-means";
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
        public paymentTerms: PaymentTerms
    ) {}
}
