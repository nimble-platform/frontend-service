import {Code} from "./code";
import {Period} from "./period";
import {Party} from "./party";
import {Attachment} from "./attachment";
/**
 * Created by deniz on 16/07/17.
 */

export class DocumentReference {
    constructor(
        public id: string,
        public uuid: string,
        public issueDate: string,
        public issueTime: string, // TODO server side handles date/time separately
        public documentTypeCode: Code,
        public documentType: string,
        public languageID: string,
        public versionID: string,
        public documentDescription: number,
        public attachment: Attachment,
        public validityPeriod: Period,
        public issuerParty: Party,
        public hjid: string
    ) {  }
}

