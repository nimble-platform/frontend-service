import {Clause} from "./clause";
import {DocumentReference} from "./document-reference";
export class DocumentClause extends Clause {
    constructor(
        public clauseDocumentRef: DocumentReference = null,
    ) {
        super();
    }
}