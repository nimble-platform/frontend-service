import { PeriodRange } from "./period-range";

export class CompanyNegotiationSettings {
    constructor(
        public paymentMeans: string[],
        public paymentTerms: string[],
        public incoterms: string[],
        public deliveryPeriodRanges: PeriodRange[],
        public deliveryPeriodUnits: string[],
        public warrantyPeriodRanges: PeriodRange[],
        public warrantyPeriodUnits: string[]
    ) {  }
}
