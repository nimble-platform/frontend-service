import {DigitalAgreementTerms} from "./digital-agreement-terms";
export class DigitalAgreement {
    constructor(public id: string = "",
                public digitalAgreementTerms: DigitalAgreementTerms = new DigitalAgreementTerms()) {
    }
}
