import { Component, OnInit } from "@angular/core";
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

@Component({
    selector: "item-information-response",
    templateUrl: "./item-information-response.component.html",
    styleUrls: ["./item-information-response.component.css"]
})
export class ItemInformationResponseComponent implements OnInit {

    callStatus: CallStatus = new CallStatus();

    request: ItemInformationRequest;
    response: ItemInformationResponse;

    constructor(private bpeService: BPEService, 
                private bpDataService: BPDataService,
                private location: Location,
                private router: Router,
                private route: ActivatedRoute) {
        
    }

    ngOnInit() {
        this.request = this.bpDataService.itemInformationRequest;
        this.response = this.bpDataService.itemInformationResponse;
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
            this.bpDataService.itemInformationRequest.buyerCustomerParty.party.id, 
            this.bpDataService.itemInformationRequest.sellerSupplierParty.party.id, 
            this.bpDataService.itemInformationResponse, 
            this.bpDataService
        );
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.processId);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(() => {
            this.callStatus.callback("Information Response sent", true);
            this.router.navigate(['dashboard']);
        }).catch(error => {
            this.callStatus.error("Failed to send Information Response");
            console.log("Error while sending information response", error);
        });
    }

    onRestart(): void {
        this.navigateToBusinessProcess("Item_Information_Request");
    }

    onNextStep(): void {
        this.navigateToBusinessProcess("Ppap");
    }

    private navigateToBusinessProcess(targetProcess: ProcessType): void {
        this.bpDataService.resetBpData();
        this.bpDataService.setBpOptionParameters("buyer", targetProcess, "Item_Information_Request");

        if(targetProcess === "Item_Information_Request") {
            this.bpDataService.resetBpData();
            this.bpDataService.initItemInformationRequest();
        }
        
        const params = this.route.snapshot.queryParams;
        this.router.navigate(['bpe/bpe-exec'], {
            queryParams: {
                catalogueId: params.catalogueId,
                id: params.id
            }
        });
    }

    selectItemSpecificationFile(file: File): void {
        if (file) {
            const reader = new FileReader();

            reader.onload = () => {
                const base64String = reader.result.split(',').pop();
                const binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                const document: DocumentReference = new DocumentReference();
                const attachment: Attachment = new Attachment();
                attachment.embeddedDocumentBinaryObject = binaryObject;
                document.attachment = attachment;
                this.response.item[0].itemSpecificationDocumentReference.push(document);
            };
            reader.readAsDataURL(file);
        }
    }

    downloadTechnicalDataSheet(binaryObject: BinaryObject, event: Event): void {
        event.preventDefault();

        var b64Data = binaryObject.value;
        var sliceSize = 512;
        b64Data = b64Data.replace(/^[^,]+,/, '');
        b64Data = b64Data.replace(/\s/g, '');
        var byteCharacters = window.atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
		
        var blob = new Blob(byteArrays, {type: binaryObject.mimeCode});
		var fileName = binaryObject.fileName;
		saveAs(blob,fileName);
    }

    /*
     * Getters
     */

    isResponseSent(): boolean {
        return this.bpDataService.processMetadata && this.bpDataService.processMetadata.processStatus === "Completed";
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
        return this.bpDataService.userRole === "buyer";
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
