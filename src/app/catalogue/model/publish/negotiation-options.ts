
export class NegotiationOptions {
    constructor(
        public price: boolean = false,
        public deliveryPeriod: boolean = false,
        public warranty: boolean = false,
        public incoterms: boolean = false,
        public paymentTerms: boolean = false,
        public paymentMeans: boolean = false
    ) {}

}