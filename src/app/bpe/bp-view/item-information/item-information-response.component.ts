import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { CallStatus } from "../../../common/call-status";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { ItemInformationResponse } from "../../../catalogue/model/publish/item-information-response";
import { DocumentReference } from "../../../catalogue/model/publish/document-reference";
import { BinaryObject } from "../../../catalogue/model/publish/binary-object";
import { Attachment } from "../../../catalogue/model/publish/attachment";
import { ProcessType } from "../../model/process-type";
import { PresentationMode } from "../../../catalogue/model/publish/presentation-mode";
import {isLogisticsService, isTransportService} from '../../../common/utils';
import {CookieService} from 'ng2-cookies';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';

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
                private route: ActivatedRoute) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

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
        const vars: ProcessVariables = ModelUtils.createProcessVariables(
            "Item_Information_Request",
            UBLModelUtils.getPartyId(this.bpDataService.itemInformationRequest.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.itemInformationRequest.sellerSupplierParty.party),
            this.cookieService.get("user_id"),
            this.bpDataService.itemInformationResponse,
            this.bpDataService
        );
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(() => {
            this.callStatus.callback("Information Response sent", true);
            var tab = "PUCHASES";
            if (this.bpDataService.bpStartEvent.userRole == "seller")
              tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        }).catch(error => {
            this.callStatus.error("Failed to send Information Response", error);
        });
    }

    onRestart(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onNextStep(): void {
        if(isTransportService(this.bpDataService.getCatalogueLine()) || !this.bpDataService.getCompanySettings().tradeDetails.ppapCompatibilityLevel) {
            this.navigateToBusinessProcess("Negotiation");
        } else {
            this.navigateToBusinessProcess("Ppap");
        }
    }

    private navigateToBusinessProcess(targetProcess: ProcessType): void {
        this.bpDataService.resetBpData();
        this.bpDataService.proceedNextBpStep("buyer", targetProcess);

        if(targetProcess === "Item_Information_Request") {
            this.bpDataService.resetBpData();
            this.bpDataService.initItemInformationRequest();
        }
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

    getResponseFile(): BinaryObject | null {
        const docs = this.getResponseDocuments();
        return docs.length > 0 ? docs[0].attachment.embeddedDocumentBinaryObject : null;
    }

    hasResponseFile(): boolean {
        return this.getResponseDocuments().length > 0;
    }

    getResponseDocuments(): DocumentReference[] {
        return this.response.item[0].itemSpecificationDocumentReference;
    }

    isBuyer(): boolean {
        return this.bpDataService.bpStartEvent.userRole === "buyer";
    }

    getRequestFile(): BinaryObject | null {
        const docs = this.getRequestDocuments();
        return docs.length > 0 ? docs[0].attachment.embeddedDocumentBinaryObject : null;
    }

    hasRequestFile(): boolean {
        return this.getRequestDocuments().length > 0;
    }

    getRequestDocuments(): DocumentReference[] {
        return this.request.itemInformationRequestLine[0].salesItem[0].item.itemSpecificationDocumentReference;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }
}
