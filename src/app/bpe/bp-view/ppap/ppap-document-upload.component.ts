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

import { Component, Input } from "@angular/core";
import { Ppap } from "../../../catalogue/model/publish/ppap";
import { PpapResponse } from "../../../catalogue/model/publish/ppap-response";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { CallStatus } from "../../../common/call-status";
import { ActivatedRoute, Router } from "@angular/router";
import { BinaryObject } from "../../../catalogue/model/publish/binary-object";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { DocumentReference } from "../../../catalogue/model/publish/document-reference";
import { Attachment } from "../../../catalogue/model/publish/attachment";
import { Location } from "@angular/common";
import { DocumentService } from "../document-service";
import { CookieService } from 'ng2-cookies';
import { ThreadEventMetadata } from '../../../catalogue/model/publish/thread-event-metadata';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "ppap-document-upload",
    templateUrl: "./ppap-document-upload.component.html",
    styleUrls: ["./ppap-document-upload.component.css"]
})
export class PpapDocumentUploadComponent {

    processid: any;
    ppap: Ppap;
    documents = [];
    ppapResponse: PpapResponse = null;
    ppapDocuments: DocumentReference[] = [];
    notes: string[];
    notesToSend: string[] = [''];
    additionalDocuments: DocumentReference[];
    additionalDocumentsToSend: DocumentReference[] = [];
    binaryObjects: { documentName: string, documents: BinaryObject[] }[] = [];
    callStatus: CallStatus = new CallStatus();
    // check whether 'Send Response' button is clicked
    submitted: boolean = false;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpDataService: BPDataService,
        private bpeService: BPEService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private cookieService: CookieService,
        private translate: TranslateService,
        private documentService: DocumentService) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        this.route.params.subscribe(params => {
            this.processid = params['processInstanceId'];

            this.bpeService.getProcessDetailsHistory(this.processid).then(task => {
                this.documentService.getInitialDocument(task, this.processMetadata.sellerFederationId).then(initialDocument => {
                    this.ppap = initialDocument as Ppap;
                    let i = 0;
                    this.documents = [];
                    for (; i < this.ppap.documentType.length; i++) {
                        this.documents.push(this.ppap.documentType[i]);
                    }
                    this.notes = this.ppap.note;
                    this.additionalDocuments = this.ppap.additionalDocumentReference;
                });
            });
        });
    }

    onSelectFile(documentName: string, binaryObject: BinaryObject) {
        let document = this.binaryObjects.find(obj => obj.documentName === documentName);
        if (!document) {
            document = { documentName, documents: [] };
            this.binaryObjects.push(document);
        }

        document.documents.push(binaryObject);
    }

    onClearFile(documentName: string, binaryObject: BinaryObject) {
        const document = this.binaryObjects.find(obj => obj.documentName === documentName);
        if (!document) {
            return
        }

        const index = document.documents.indexOf(binaryObject);
        if (index >= 0) {
            document.documents.splice(index, 1);
        }
    }

    onBack() {
        this.location.back();
    }

    isSent(document: string): boolean {
        for (var i = 0; i < this.binaryObjects.length; i++) {
            if (document === this.binaryObjects[i].documentName) {
                return true;
            }
        }
        return false;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    responseToPpapRequest(acceptedIndicator: boolean) {
        this.callStatus.submit();
        this.submitted = true;
        for (let i = 0; i < this.binaryObjects.length; i++) {
            for (let j = 0; j < this.binaryObjects[i].documents.length; j++) {
                let attachment: Attachment = new Attachment(this.binaryObjects[i].documents[j]);
                let documentRef: DocumentReference = new DocumentReference(UBLModelUtils.generateUUID(), this.binaryObjects[i].documentName, attachment);
                this.ppapDocuments.push(documentRef);
            }
        }


        this.ppapResponse = UBLModelUtils.createPpapResponseWithPpapCopy(this.ppap, acceptedIndicator);
        if (this.ppapDocuments.length == 0) {
            this.ppapResponse.requestedDocument = [];
        } else {
            this.ppapResponse.requestedDocument = this.ppapDocuments;
        }

        this.ppapResponse.note = this.notesToSend;
        this.ppapResponse.additionalDocumentReference = this.additionalDocumentsToSend;

        //this.callStatus.submit();
        this.bpeService.startProcessWithDocument(this.ppapResponse, this.ppapResponse.sellerSupplierParty.party.federationInstanceID).then(res => {
            this.callStatus.callback("Ppap Response placed", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], { queryParams: { tab: tab, ins: this.ppapResponse.sellerSupplierParty.party.federationInstanceID } });
        }).catch(error => {
            this.submitted = false;
            error => this.callStatus.error("Failed to send Ppap Response", error)
        });

    }
}
