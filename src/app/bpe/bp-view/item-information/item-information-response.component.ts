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

import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { CallStatus } from "../../../common/call-status";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { ItemInformationResponse } from "../../../catalogue/model/publish/item-information-response";
import { DocumentReference } from "../../../catalogue/model/publish/document-reference";
import { BinaryObject } from "../../../catalogue/model/publish/binary-object";
import { Attachment } from "../../../catalogue/model/publish/attachment";
import { ProcessType } from "../../model/process-type";
import { PresentationMode } from "../../../catalogue/model/publish/presentation-mode";
import {isLogisticsService, isTransportService} from '../../../common/utils';
import {CookieService} from 'ng2-cookies';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "item-information-response",
    templateUrl: "./item-information-response.component.html",
    styleUrls: ["./item-information-response.component.css"]
})
export class ItemInformationResponseComponent implements OnInit {

    callStatus: CallStatus = new CallStatus();

    @Input() request: ItemInformationRequest;
    @Input() response: ItemInformationResponse;
    @Input() readonly: boolean = false;

    requestFiles: BinaryObject[] = [];
    responseFiles: BinaryObject[] = [];

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;
    isLogisticsService:boolean = false;
    isTransportService:boolean = false;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router,
                private cookieService: CookieService,
                private translate: TranslateService,
                private route: ActivatedRoute) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        if (!this.request) {
            this.request = this.bpDataService.itemInformationRequest;
        }
        if(this.request) {
            const documents = this.request.itemInformationRequestLine[0].salesItem[0].item.itemSpecificationDocumentReference;
            this.requestFiles = documents.map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }
        if (!this.response) {
            this.response = this.bpDataService.itemInformationResponse;
        }
        if(this.response) {
            this.responseFiles = this.getResponseDocuments().map(doc => doc.attachment.embeddedDocumentBinaryObject);
        }

        this.isTransportService = isTransportService(this.bpDataService.getCatalogueLine());
        this.isLogisticsService = isLogisticsService(this.bpDataService.getCatalogueLine());
    }

    /*
     * Event handlers
     */

    onBack(): void {
        this.location.back();
    }

    onSendResponse(): void {
        this.callStatus.submit();
        this.bpeService.startProcessWithDocument(this.bpDataService.itemInformationResponse,this.bpDataService.itemInformationResponse.sellerSupplierParty.party.federationInstanceID).then(() => {
            this.callStatus.callback("Information Response sent", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
              tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab,ins: this.bpDataService.itemInformationResponse.sellerSupplierParty.party.federationInstanceID}});
        }).catch(error => {
            this.callStatus.error("Failed to send Information Response", error);
        });
    }

    onRestart(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onNextStep(): void {
        if(isLogisticsService(this.bpDataService.getCatalogueLine()) || !this.bpDataService.getCompanySettings().tradeDetails.ppapCompatibilityLevel) {
            this.navigateToBusinessProcess("Negotiation");
        } else {
            if (this.bpDataService.getCompanyWorkflowMap(null).get('Ppap')) {
                this.navigateToBusinessProcess('Ppap');
            } else {
                this.navigateToBusinessProcess('Negotiation');
            }
        }
    }

    private navigateToBusinessProcess(targetProcess: ProcessType): void {
        // this.bpDataService.resetBpData();
        this.request = null;
        this.response = null;
        this.bpDataService.proceedNextBpStep("buyer", targetProcess);
    }

    onSelectItemSpecificationFile(binaryObject: BinaryObject): void {
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        this.response.item[0].itemSpecificationDocumentReference.push(document);
    }

    onUnselectItemSpecificationFile(binaryObject: BinaryObject): void {
        const index = this.response.item[0].itemSpecificationDocumentReference.findIndex(doc => {
            return doc.attachment.embeddedDocumentBinaryObject === binaryObject;
        });

        if(index >= 0) {
            this.response.item[0].itemSpecificationDocumentReference.splice(index, 1);
        }
    }

    /*
     * Getters
     */

    isResponseSent(): boolean {
        return this.readonly ||
            (   this.processMetadata
             && this.processMetadata.processStatus === "Completed");
    }

    getPresentationMode(): PresentationMode {
        return this.isResponseSent() ? "view" : "edit";
    }

    getResponseDocuments(): DocumentReference[] {
        return this.response.item[0].itemSpecificationDocumentReference;
    }

    isBuyer(): boolean {
        return this.bpDataService.bpActivityEvent.userRole === "buyer";
    }

    getRequestDocuments(): DocumentReference[] {
        return this.request.itemInformationRequestLine[0].salesItem[0].item.itemSpecificationDocumentReference;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isNextStepDisabled(): boolean {
        return this.isRepeatRequestDisabled() || this.bpDataService.isFinalProcessInTheWorkflow('Item_Information_Request');
    }

    isRepeatRequestDisabled(): boolean {
        return this.isLoading() || this.readonly || this.processMetadata.areProductsDeleted[0] || this.processMetadata.collaborationStatus == "COMPLETED" || this.processMetadata.collaborationStatus == "CANCELLED";
    }
}
