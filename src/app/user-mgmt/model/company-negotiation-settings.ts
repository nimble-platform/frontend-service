import { PeriodRange } from "./period-range";
import { PAYMENT_MEANS, INCOTERMS } from "../../catalogue/model/constants";
import { UBLModelUtils } from "../../catalogue/model/ubl-model-utils";

export class CompanyNegotiationSettings {
    constructor(
        public paymentMeans: string[] = [].concat(PAYMENT_MEANS),
        public paymentTerms: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings(),
        public incoterms: string[] = [].concat(INCOTERMS),
        public deliveryPeriodRanges: PeriodRange[] = [{ start: 0, end: 100 }, { start: 0, end: 15 }],
        public deliveryPeriodUnits: string[] = ["day(s)", "week(s)"],
        public warrantyPeriodRanges: PeriodRange[] = [{ start: 0, end: 48 }, { start: 0, end: 4 }],
        public warrantyPeriodUnits: string[] = ["month(s)", "year(s)"]
    ) {  }
}
