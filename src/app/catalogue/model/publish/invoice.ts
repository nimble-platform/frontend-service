import {DocumentReference} from './document-reference';

export class Invoice {
    constructor(
        public id: string = null,
        public originatorDocumentReference:DocumentReference[] = []
    ) {}
}
