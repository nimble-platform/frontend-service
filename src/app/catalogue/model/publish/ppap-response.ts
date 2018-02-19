import {SupplierParty} from "./supplier-party";
import {CustomerParty} from "./customer-party";
import {DocumentReference} from "./document-reference";
export class PpapResponse{
    constructor(
        public note:string = null,
        public rejectionNote: string = null,
        public acceptedIndicator: boolean = null,
        public buyerCustomerParty:CustomerParty = null,
        public sellerSupplierParty:SupplierParty = null,
        public requestedDocument:DocumentReference[] = null,
        public ppapDocumentReference:DocumentReference = null
    )
    {}
}