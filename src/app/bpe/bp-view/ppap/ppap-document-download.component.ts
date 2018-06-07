import {Component, Input} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {CatalogueService} from "../../../catalogue/catalogue.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import {ActivityVariableParser} from "../activity-variable-parser";

@Component({
    selector: 'ppap-document-download',
    templateUrl: './ppap-document-download.component.html'
})

export class PpapDocumentDownloadComponent{

    constructor(public bpDataService: BPDataService,
                public bpeService: BPEService,
                public catalogueService:CatalogueService,
                public route: ActivatedRoute,
                private router:Router) {
    }

    processid : any;

    ppapResponse : PpapResponse = null;
    ppapDocuments : DocumentReference[] = [];
    note: any;
    noteBuyer: any;
    documents = [];
    keys = [];

    requestedDocuments = [];
    ngOnInit() {
        this.route.queryParams.subscribe(params =>{
            this.processid = params['pid'];

            this.bpeService.getProcessDetailsHistory(this.processid).then(task => {
                let ppap = ActivityVariableParser.getInitialDocument(task).value as Ppap;
                this.noteBuyer = ppap.note;
                this.ppapResponse = ActivityVariableParser.getResponse(task).value as PpapResponse;
                this.ppapDocuments = this.ppapResponse.requestedDocument;

                for(let i=0;i<this.ppapDocuments.length;i++){
                    if(!(this.ppapDocuments[i].documentType in this.documents)){
                        this.documents[this.ppapDocuments[i].documentType]=[this.ppapDocuments[i].attachment.embeddedDocumentBinaryObject];
                    }
                    else{
                        this.documents[this.ppapDocuments[i].documentType].push(this.ppapDocuments[i].attachment.embeddedDocumentBinaryObject);
                    }
                }
                this.note = this.ppapResponse.note;
                this.keys = Object.keys(this.documents);

                this.requestedDocuments = ppap.documentType;
            });
        });

    }

    downloadFile(key) :void {
        var binaryObjects = this.documents[key];
        for(var j=0;j<binaryObjects.length;j++){
            var binaryString = window.atob(binaryObjects[j].value);
            var binaryLen = binaryString.length;
            var bytes = new Uint8Array(binaryLen);
            for (var i = 0; i < binaryLen; i++) {
                var ascii = binaryString.charCodeAt(i);
                bytes[i] = ascii;
            }
            var a = document.createElement("a");
            document.body.appendChild(a);
            var blob = new Blob([bytes], {type:binaryObjects[j].mimeCode});
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = binaryObjects[j].fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }
}
