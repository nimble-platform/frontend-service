import {Component, Input} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";

@Component({
    selector: 'ppap-clause',
    templateUrl: './ppap-clause.component.html'
})

export class PpapClauseComponent {

    @Input() ppapResponse: PpapResponse;

    constructor(public bpDataService: BPDataService) {
    }

    downloadFile(doc: DocumentReference): void {
        var binaryString = window.atob(doc.attachment.embeddedDocumentBinaryObject.value);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        var a = document.createElement("a");
        document.body.appendChild(a);
        var blob = new Blob([bytes], {type: doc.attachment.embeddedDocumentBinaryObject.mimeCode});
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = doc.attachment.embeddedDocumentBinaryObject.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
