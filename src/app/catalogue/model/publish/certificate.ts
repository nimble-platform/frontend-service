import {Code} from "./code";
import {Party} from "./party";
import {DocumentReference} from "./document-reference";
/**
 * Created by deniz on 16/07/17.
 */

export class Certificate {
    constructor(
        public id: string,
        public certificateTypeCode: Code,
        public certificateType: string,
        public remarks: String[],
        public issuerParty: Party,
        public documentReference: DocumentReference
    ) {  }
}