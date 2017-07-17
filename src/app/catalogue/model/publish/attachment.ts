import {BinaryObject} from "./binary-object";
import {ExternalReference} from "./external-reference";
/**
 * Created by deniz on 16/07/17.
 */

export class Attachment {
    constructor(
        public embeddedDocumentBinaryObject: BinaryObject,
        public externalReference: ExternalReference,
        public hjid: string
    ) {  }
}