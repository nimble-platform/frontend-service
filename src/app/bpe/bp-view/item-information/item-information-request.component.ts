import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { CookieService } from "ng2-cookies";
import { UserService } from "../../../user-mgmt/user.service";
import { CallStatus } from "../../../common/call-status";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { ItemInformationRequest } from "../../../catalogue/model/publish/item-information-request";
import { DocumentReference } from "../../../catalogue/model/publish/document-reference";
import { BinaryObject } from "../../../catalogue/model/publish/binary-object";
import { Attachment } from "../../../catalogue/model/publish/attachment";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { copy } from "../../../common/utils";
import { PresentationMode } from "../../../catalogue/model/publish/presentation-mode";
/**
 * Created by suat on 19-Nov-17.
 */
@Component({
    selector: "item-information-request",
    templateUrl: "./item-information-request.component.html",
    styleUrls: ["./item-information-request.component.css"]
})
export class ItemInformationRequestComponent implements OnInit {

    callStatus: CallStatus = new CallStatus();

    request: ItemInformationRequest;
    files: BinaryObject[]

    constructor(private bpeService: BPEService, 
                private bpDataService: BPDataService, 
                private userService: UserService, 
                private cookieService: CookieService, 
                private location: Location,
                private router: Router) {
        
    }

    ngOnInit() {
        this.request = this.bpDataService.itemInformationRequest;
        const documents = this.request.itemInformationRequestLine[0].salesItem[0].item.itemSpecificationDocumentReference;
        this.files = documents.map(doc => doc.attachment.embeddedDocumentBinaryObject);
    }

    onBack(): void {
        this.location.back();
    }

    isRequestSent() {
        return !!this.bpDataService.processMetadata;
    }

    getPresentationMode(): PresentationMode {
        return this.isRequestSent() ? "view" : "edit";
    }

    onSkip(): void {
        this.bpDataService.resetBpData();
        this.bpDataService.initPpap([]);
        this.bpDataService.setBpOptionParameters(this.bpDataService.userRole, "Ppap", "Item_Information_Request");
    }

    onSendRequest(): void {
        this.callStatus.submit();
        const itemInformationRequest: ItemInformationRequest = copy(this.bpDataService.itemInformationRequest);

        // final check on the order
        itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(itemInformationRequest);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const sellerId: string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId)
        ])
        .then(([buyerParty, sellerParty]) => {
            itemInformationRequest.buyerCustomerParty = new CustomerParty(buyerParty);
            itemInformationRequest.sellerSupplierParty = new SupplierParty(sellerParty);

            const vars: ProcessVariables = ModelUtils.createProcessVariables(
                "Item_Information_Request", buyerId, sellerId, itemInformationRequest, this.bpDataService);
            const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

            return this.bpeService.startBusinessProcess(piim)
        })
        .then(() => {
            this.callStatus.callback("Item Information Request sent", true);
            this.router.navigate(['dashboard']);
        })
        .catch(error => {
            this.callStatus.error("Failed to send Item Information Request", error);
        });
    }

    onSelectItemSpecificationFile(binaryObject: BinaryObject): void {
        const documents = this.getRequestDocuments();
        const document: DocumentReference = new DocumentReference();
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;
        documents.push(document);
    }

    onUnselectItemSpecificationFile(binaryObject: BinaryObject): void {
        const documents = this.getRequestDocuments();
        const index = documents.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if(index >= 0) {
            documents.splice(index, 1);
        }
    }

    getDataSheetFileClasses(): any {
        return {
            "no-document": !this.hasUploadedDocument(),
            disabled: this.isLoading() || this.isRequestSent()
        };
    }

    getDataSheetFileName(): string {
        const docs = this.getRequestDocuments();
        return docs.length > 0 ? docs[0].attachment.embeddedDocumentBinaryObject.fileName : "Choose a file...";
    }

    getRequestDocuments(): DocumentReference[] {
        return this.request.itemInformationRequestLine[0].salesItem[0].item.itemSpecificationDocumentReference;
    }

    hasUploadedDocument(): boolean {
        return this.getRequestDocuments().length > 0;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }
}
