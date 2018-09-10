import {Component, Input, OnInit } from "@angular/core";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import { CallStatus } from "../../../common/call-status";

@Component({
    selector: 'ppap-clause',
    templateUrl: './ppap-clause.component.html'
})
export class PpapClauseComponent implements OnInit {

    @Input() ppapResponse: PpapResponse;

    constructor() {
    }

    ngOnInit() {

    }

    downloadFile(doc: DocumentReference, event: Event): void {
        event.preventDefault();

        const binaryString = window.atob(doc.attachment.embeddedDocumentBinaryObject.value);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
            const ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        const a = document.createElement("a");
        document.body.appendChild(a);
        const blob = new Blob([bytes], {type: doc.attachment.embeddedDocumentBinaryObject.mimeCode});
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = doc.attachment.embeddedDocumentBinaryObject.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
