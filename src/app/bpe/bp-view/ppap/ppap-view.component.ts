import {Component, Input} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {CatalogueService} from "../../../catalogue/catalogue.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {PpapDocument} from "../../../catalogue/model/publish/PpapDocument";
import {Ppap} from "../../../catalogue/model/publish/ppap";

@Component({
    selector: 'ppap-view',
    templateUrl: './ppap-view.component.html'
})

export class PpapViewComponent{

    constructor(public bpDataService: BPDataService,
                public bpeService: BPEService,
                public catalogueService:CatalogueService,
                public route: ActivatedRoute,
                private router:Router) {
    }

    processid : any;
    id : any;
    catalogueId: any;

    ppapResponse : PpapResponse = null;
    ppapDocuments : PpapDocument[] = [];
    note: any;
    documents = [];
    keys = [];

    requestedDocuments = [];
    ngOnInit() {
        this.route.queryParams.subscribe(params =>{
            this.processid = params['pid'];
            this.id = params['id'];
            this.catalogueId = params['catalogueId'];

            this.catalogueService.getCatalogueLine(this.catalogueId,this.id).then(line =>{
                this.bpDataService.catalogueLine = line;
            }).catch(error => {

            });

            this.bpeService.getProcessDetailsHistory(this.processid).then(task => {
                this.ppapResponse = task[4].value as PpapResponse;
                this.ppapDocuments = this.ppapResponse.ppapDocument;

                for(let i=0;i<this.ppapDocuments.length;i++){
                    if(!(this.ppapDocuments[i].documentReference.documentType in this.documents)){
                        this.documents[this.ppapDocuments[i].documentReference.documentType]=[this.ppapDocuments[i].documentReference.attachment.embeddedDocumentBinaryObject];
                    }
                    else{
                        this.documents[this.ppapDocuments[i].documentReference.documentType].push(this.ppapDocuments[i].documentReference.attachment.embeddedDocumentBinaryObject);
                    }
                }
                this.note = this.ppapResponse.note;
                this.keys = Object.keys(this.documents);

                let ppap = task[3].value as Ppap;
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