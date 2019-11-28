import {Component, Input} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {ActivatedRoute} from "@angular/router";
import {PpapResponse} from "../../../catalogue/model/publish/ppap-response";
import {Ppap} from "../../../catalogue/model/publish/ppap";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import { Location } from "@angular/common";
import { BinaryObject } from "../../../catalogue/model/publish/binary-object";
import {DocumentService} from "../document-service";
import {TranslateService} from '@ngx-translate/core';

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
    // whether the item is deleted or not
    @Input() isCatalogueLineDeleted:boolean = false ;

    processMetadata;
    ppapDocuments : DocumentReference[] = [];
    notes: string[];
    notesBuyer: string[];
    additionalDocuments:DocumentReference[];
    additionalDocumentsBuyer:DocumentReference[];
    documents: UploadedDocuments = {};
    keys = [];

    requestedDocuments = [];

    constructor(private bpDataService: BPDataService,
                private bpeService: BPEService,
                private route: ActivatedRoute,
                private location: Location,
                private translate: TranslateService,
                private documentService: DocumentService) {
    }

    ngOnInit() {
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        if (!this.ppapResponse) {
            this.route.params.subscribe(params => {
                const processid = params['processInstanceId'];

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
        this.notesBuyer = this.ppap.note;
        this.additionalDocumentsBuyer = this.ppap.additionalDocumentReference;
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
        this.notes = this.ppapResponse.note;
        this.additionalDocuments = this.ppapResponse.additionalDocumentReference;
        this.keys = Object.keys(this.documents);

        this.requestedDocuments = this.ppap.documentType;
    }

    onBack() {
        this.location.back();
    }

    onNextStep() {
        this.bpDataService.proceedNextBpStep(this.bpDataService.bpActivityEvent.userRole, "Negotiation");
    }

    isNextStepDisabled(): boolean {
        return this.bpDataService.isFinalProcessInTheWorkflow('Ppap') || this.isCatalogueLineDeleted || this.processMetadata.isCollaborationFinished;
    }

    isBuyer(): boolean {
        return this.bpDataService.bpActivityEvent.userRole === "buyer";
    }
}
