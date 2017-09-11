import {Code} from "./code";
import {Period} from "./period";
import {Party} from "./party";
import {Attachment} from "./attachment";
/**
 * Created by deniz on 16/07/17.
 */

export class DocumentReference {
    constructor(
        public id: string = null,
        public uuid: string = null,
        public issueDate: string = null,
        public issueTime: string = null, // TODO server side handles date/time separately
        public documentTypeCode: Code = null,
        public documentType: string = null,
        public languageID: string = null,
        public versionID: string = null,
        public documentDescription: number = null,
        public attachment: Attachment = null,
        public validityPeriod: Period = null,
        public issuerParty: Party = null,
        public hjid: string = null
    ) {  }
}

