import {Code} from "./code";
import {DocumentReference} from "./document-reference";
import {Country} from "./country";
/**
 * Created by deniz on 16/07/17.
 */

export class Certificate {
    constructor(
        public certificateType: string = "",
        public certificateTypeCode: Code = new Code(),
        public remarks: string = "",
        public documentReference: DocumentReference[] = [],
        public country: Country[] = [],
        public hjid: number = null
    ) {  }
}