import {DigitalAgreementTerms} from "./digital-agreement-terms";
import {Party} from "./party";
import {Item} from "./item";
import {DocumentReference} from "./document-reference";
export class DigitalAgreement {
    constructor(public id: string = "",
                public participantParty: Party[] = [],
                public item: Item = null,
                public digitalAgreementTerms: DigitalAgreementTerms = new DigitalAgreementTerms(),
                public quotationReference: DocumentReference = new DocumentReference()) {
    }
}
