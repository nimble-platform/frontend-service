import { OrderLine } from "./order-line";
import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { PaymentMeans } from "./payment-means";
import { Address } from "./address";
import { Period } from "./period";
import { Contract } from "./contract";
import { PaymentTerms } from "./payment-terms";
import { MonetaryTotal } from "./monetary-total";
import {DocumentReference} from './document-reference';
export class Order {
    constructor(
        public id: string = null,
        public note: string[] = [''],
        public requestedDeliveryPeriod: Period = new Period(),
        // DO NOT USE, this is not saved in the back end...
        // use order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address instead.
        public deliveryAddress: Address = new Address(),
        public contract: Contract[] = null,
        public buyerCustomerParty: CustomerParty = null,
        public sellerSupplierParty: SupplierParty = null,
        public paymentMeans: PaymentMeans = new PaymentMeans(),
        public paymentTerms: PaymentTerms = new PaymentTerms(),
        public anticipatedMonetaryTotal: MonetaryTotal = new MonetaryTotal(),
        public orderLine: OrderLine[] = null,
        public additionalDocumentReference:DocumentReference[] = []
    ) {}
}
