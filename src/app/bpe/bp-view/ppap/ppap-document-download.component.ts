import {Component, Input} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import { Location } from "@angular/common";
import { BinaryObject } from "../../../catalogue/model/publish/binary-object";
import {DocumentService} from "../document-service";

interface UploadedDocuments {
    [doc: string]: BinaryObject[];
}

@Component({
    selector: "ppap-document-download",
    templateUrl: "./ppap-document-download.component.html",
    styleUrls: ["./ppap-document-download.component.css"]
})
export class PpapDocumentDownloadComponent{

    @Input() ppapResponse: PpapResponse;
    @Input() ppap: Ppap;

    ppapDocuments : DocumentReference[] = [];
    note: any;
    noteBuyer: any;
    documents: UploadedDocuments = {};
    keys = [];

    requestedDocuments = [];

    constructor(private bpDataService: BPDataService,
                private bpeService: BPEService,
                private route: ActivatedRoute,
                private location: Location,
                private documentService: DocumentService) {
    }

    ngOnInit() {
        if(!this.ppapResponse) {
            this.route.queryParams.subscribe(params => {
                const processid = params['pid'];
    
                this.bpeService.getProcessDetailsHistory(processid).then(task => {
                    return Promise.all([
                        this.documentService.getInitialDocument(task),
                        this.documentService.getResponseDocument(task)
                    ]).then(([initialDocument, responseDocument]) => {
                        this.ppap = initialDocument as Ppap;
                        this.ppapResponse = responseDocument as PpapResponse;
                        this.initFromPpap();
                    });
                });
            });
        } else {
            if(!this.ppap) {
                throw new Error("ppap must be set if ppapResponse is set.");
            }
            this.initFromPpap();
        }

    }
    
    private initFromPpap() {
        this.noteBuyer = this.ppap.note[0];
        this.ppapDocuments = this.ppapResponse.requestedDocument;

        for (let i = 0; i < this.ppapDocuments.length; i++) {
            if (!(this.ppapDocuments[i].documentType in this.documents)) {
                this.documents[this.ppapDocuments[i].documentType] = [
                    this.ppapDocuments[i].attachment.embeddedDocumentBinaryObject
                ];
            } else {
                this.documents[this.ppapDocuments[i].documentType].push(
                    this.ppapDocuments[i].attachment.embeddedDocumentBinaryObject
                );
            }
        }
        this.note = this.ppapResponse.note[0];
        this.keys = Object.keys(this.documents);

        this.requestedDocuments = this.ppap.documentType;
    }

    isBuyer(): boolean {
        return this.bpDataService.userRole === "buyer";
    }

    onBack() {
        this.location.back();
    }

    onNextStep() {
        this.bpDataService.resetBpData();
        this.bpDataService.initRfq(null).then(() => {
            this.bpDataService.setBpOptionParameters(this.bpDataService.userRole, "Negotiation", "Ppap");
        })
    }

    downloadFile(key) :void {
        const binaryObjects: BinaryObject[] = this.documents[key];
        for(let j=0; j < binaryObjects.length; j++) {
            const binaryString = window.atob(binaryObjects[j].value);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const a = document.createElement("a");
            document.body.appendChild(a);
            const blob = new Blob([bytes], {type:binaryObjects[j].mimeCode});
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = binaryObjects[j].fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }
}

