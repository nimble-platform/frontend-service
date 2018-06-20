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

    constructor(private bpeService: BPEService, 
                private bpDataService: BPDataService, 
                private userService: UserService, 
                private cookieService: CookieService, 
                private location: Location,
                private router: Router) {
        
    }

    ngOnInit() {
        this.request = this.bpDataService.itemInformationRequest;
    }

    onBack(): void {
        this.location.back();
    }

    isRequestSent() {
        return !!this.bpDataService.processMetadata;
    }

    onSkip(): void {
        this.bpDataService.resetBpData();
        this.bpDataService.initPpap([]);
        this.bpDataService.setBpOptionParameters(this.bpDataService.userRole, 'Ppap',null);
    }

    onSendRequest(): void {
        this.callStatus.submit();
        let itemInformationRequest: ItemInformationRequest = JSON.parse(JSON.stringify(this.bpDataService.itemInformationRequest));

        // final check on the order
        itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(itemInformationRequest);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId: string = this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id;
        let buyerId: string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            itemInformationRequest.buyerCustomerParty = new CustomerParty(buyerParty);

            this.userService.getParty(sellerId).then(sellerParty => {
                itemInformationRequest.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars: ProcessVariables = ModelUtils.createProcessVariables("Item_Information_Request", buyerId, sellerId, itemInformationRequest, this.bpDataService);
                let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                .then(() => {
                    this.callStatus.callback("Item Information Request sent", true);
                    this.router.navigate(['dashboard']);
                })
                .catch(error => {
                    this.callStatus.error("Failed to send Item Information Request");
                    console.log("Error while sending information request", error);
                });
            });
        });
    }

    selectItemSpecificationFile(file: File): void {
        const documentReferenceArray = this.getRequestDocuments();
        if (file) {
            const reader = new FileReader();

            reader.onload = function () {
                const base64String = reader.result.split(',').pop();
                const binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                const document: DocumentReference = new DocumentReference();
                const attachment: Attachment = new Attachment();
                attachment.embeddedDocumentBinaryObject = binaryObject;
                document.attachment = attachment;
                documentReferenceArray.push(document);
            };
            reader.readAsDataURL(file);
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
