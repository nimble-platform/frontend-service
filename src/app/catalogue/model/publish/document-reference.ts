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
        public documentType: string = null,
        public attachment: Attachment = null,
    ) {  }
}

