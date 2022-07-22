/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { Attachment } from '../model/publish/attachment';
import { DocumentReference } from '../model/publish/document-reference';
import { BinaryObject } from '../model/publish/binary-object';
import {COMPANY_TERMS_AND_CONDITIONS_DOCUMENT_TYPE} from '../../common/constants';



@Component({
    selector: 'note-file-view',
    templateUrl: './note-file-view.component.html'
})
export class NoteFileViewComponent implements OnInit {

    @Input() notes: string[];
    @Input() requestNotes: string[]; // special case for negotiation response
    @Input() readonly: boolean = true;
    @Input() label: string;

    @Input() firstCol: string = "col-3";
    @Input() secondCol: string = null; // negotiation request
    @Input() thirdCol: string = null; // special case for negotiation response
    @Input() lastCol: string = "col-9";

    // file related variables
    @Input() documents: DocumentReference[];
    @Input() requestDocuments: DocumentReference[]; // special case for negotiation response

    files: BinaryObject[];
    requestFiles: BinaryObject[];

    constructor(
    ) {
    }
    ngOnInit() {
        if (this.documents) {
            // discard files which do not have any attachments and the ones which are company terms and conditions
            this.files = this.documents.filter(doc => doc.attachment != null && doc.documentType != COMPANY_TERMS_AND_CONDITIONS_DOCUMENT_TYPE).map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }
        if (this.requestDocuments) {
            // discard files which do not have any attachments and the ones which are company terms and conditions
            this.requestFiles = this.requestDocuments.filter(doc => doc.attachment != null && doc.documentType != COMPANY_TERMS_AND_CONDITIONS_DOCUMENT_TYPE).map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }
    }

    onRemoveNote(index) {
        this.notes.splice(index, 1);
    }

    onAddNote() {
        this.notes.push("");
    }

    onSelectFile(binaryObject: BinaryObject) {
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        this.documents.push(document);
    }

    onUnSelectFile(binaryObject: BinaryObject) {
        const index = this.documents.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if (index >= 0) {
            this.documents.splice(index, 1);
        }
    }

    customTrackBy(index: number, obj: any): any{
        return index;
    }
}
