import {BinaryObject} from "./binary-object";
import {ExternalReference} from "./external-reference";
/**
 * Created by deniz on 16/07/17.
 */

export class Attachment {
    constructor(
        //TODO is BinaryObject equivalent to BinaryObjectType in server side?
        public embeddedDocumentBinaryObject: BinaryObject,
        public externalReference: ExternalReference
        // TODO left hjid out?
    ) {  }
}