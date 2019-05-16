import {Period} from "./period";
export class DigitalAgreementTerms {
    constructor(public validityPeriod: Period = new Period()) {
    }
}
