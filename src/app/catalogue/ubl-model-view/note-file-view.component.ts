import {Component, Input, OnInit} from '@angular/core';
import {Attachment} from '../model/publish/attachment';
import {DocumentReference} from '../model/publish/document-reference';
import {BinaryObject} from '../model/publish/binary-object';

@Component({
    selector: 'note-file-view',
    templateUrl: './note-file-view.component.html'
})
export class NoteFileViewComponent implements OnInit{

    @Input() notes:string[];
    @Input() requestNotes:string[]; // special case for negotiation response
    @Input() readonly:boolean = true;
    @Input() label:string;

    @Input() firstCol:string = "col-3";
    @Input() secondCol:string = null; // negotiation request
    @Input() thirdCol:string = null; // special case for negotiation response
    @Input() lastCol:string = "col-9";

    // file related variables
    @Input() documents:DocumentReference[];
    @Input() requestDocuments:DocumentReference[]; // special case for negotiation response

    files:BinaryObject[];
    requestFiles:BinaryObject[];
    ngOnInit(){
        if(this.documents){
            this.files = this.documents.map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }
        if(this.requestDocuments){
            this.requestFiles = this.requestDocuments.map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }
    }

    onRemoveNote(index){
        this.notes.splice(index,1);
    }

    onAddNote(){
        this.notes.push("");
    }

    setNote(index,event){
        this.notes[index] = event.target.value;
    }

    onSelectFile(binaryObject: BinaryObject){
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        this.documents.push(document);
    }

    onUnSelectFile(binaryObject: BinaryObject){
        const index = this.documents.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if(index >= 0) {
            this.documents.splice(index, 1);
        }
    }

}