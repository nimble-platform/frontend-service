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
import { copy, isTransportService } from "../../../common/utils";
import { PresentationMode } from "../../../catalogue/model/publish/presentation-mode";
import {DocumentService} from '../document-service';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
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

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private userService: UserService,
                private cookieService: CookieService,
                private location: Location,
                private documentService: DocumentService,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.request = this.bpDataService.itemInformationRequest;
        const documents = this.request.itemInformationRequestLine[0].salesItem[0].item.itemSpecificationDocumentReference;
        this.files = documents.map(doc => doc.attachment.embeddedDocumentBinaryObject);
    }

    onBack(): void {
        this.location.back();
    }

    isRequestSent() {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    getPresentationMode(): PresentationMode {
        return this.isRequestSent() ? "view" : "edit";
    }

    onSkip(): void {
        this.bpDataService.resetBpData();
        if(isTransportService(this.bpDataService.getCatalogueLine()) || !this.bpDataService.getCompanySettings().tradeDetails.ppapCompatibilityLevel) {
            // skip ppap
            this.bpDataService.initRfq(this.bpDataService.getCompanySettings().negotiationSettings).then(() => {
                this.bpDataService.proceedNextBpStep(this.bpDataService.bpStartEvent.userRole,"Negotiation");
            });
        } else {
            this.bpDataService.initPpap([]);
            this.bpDataService.proceedNextBpStep(this.bpDataService.bpStartEvent.userRole, "Ppap");
        }
    }

    onSendRequest(): void {
        this.callStatus.submit();
        const itemInformationRequest: ItemInformationRequest = copy(this.bpDataService.itemInformationRequest);

        // final check on the order
        itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(itemInformationRequest);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const sellerId: string = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId)
        ])
        .then(([buyerParty, sellerParty]) => {
            itemInformationRequest.buyerCustomerParty = new CustomerParty(buyerParty);
            itemInformationRequest.sellerSupplierParty = new SupplierParty(sellerParty);

            const vars: ProcessVariables = ModelUtils.createProcessVariables(
                "Item_Information_Request", buyerId, sellerId,this.cookieService.get("user_id"), itemInformationRequest, this.bpDataService);
            const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

            return this.bpeService.startBusinessProcess(piim)
        })
        .then(() => {
            this.callStatus.callback("Item Information Request sent", true);
            var tab = "PUCHASES";
            if (this.bpDataService.bpStartEvent.userRole == "seller")
              tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        })
        .catch(error => {
            this.callStatus.error("Failed to send Item Information Request", error);
        });
    }

    onUpdateRequest(): void {
        this.callStatus.submit();
        const itemInformationRequest: ItemInformationRequest = copy(this.bpDataService.itemInformationRequest);

        this.bpeService.updateBusinessProcess(JSON.stringify(itemInformationRequest),"ITEMINFORMATIONREQUEST",this.processMetadata.processId)
            .then(() => {
                this.documentService.updateCachedDocument(itemInformationRequest.id,itemInformationRequest);
                this.callStatus.callback("Item Information Request updated", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Item Information Request", error);
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

    isEmpty(): boolean {
      var empty = true;
      if (this.request.note.length > 1 || (this.request.note.length == 1 && this.request.note[0] != ""))
        empty = false;
      else if (this.request.additionalDocumentReference.length > 0)
        empty = false;
      else if (this.getRequestDocuments().length > 0)
        empty = false;
      return empty;
    }
}
