
export class NegotiationOptions {
    constructor(
        public price: boolean = false,
        public deliveryPeriod: boolean = false,
        public waranty: boolean = false,
        public incoterms: boolean = false,
        public paymentTerms: boolean = false,
        public paymentMeans: boolean = false
    ) {}

    isNegotiatingAnyTerm(): boolean {
        return this.price
            || this.deliveryPeriod
            || this.waranty
            || this.incoterms
            || this.paymentTerms
            || this.paymentMeans;
    }
}