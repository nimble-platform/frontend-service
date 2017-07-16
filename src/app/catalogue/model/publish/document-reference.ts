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
        public issueDate: string, // TODO not sure about string for date/time
        public issueTime: string, // TODO not sure about string for date/time
        public documentTypeCode: Code,
        public documentType: string,
        public languageID: string,
        public versionID: string,
        public documentDescription: number, // TODO this is of type BigDecimal in server side
        public attachment: Attachment,
        public validityPeriod: Period,
        public issuerParty: Party
        // TODO left hjid out?
    ) {  }
}

