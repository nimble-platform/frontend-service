import {Component, Input, OnInit} from "@angular/core";
import {CatalogueLine} from "../../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "../bp-data-service";
import {BPEService} from "../../bpe.service";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {CookieService} from "ng2-cookies";
import * as myGlobals from '../../../globals';
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {ProcessVariables} from "../../model/process-variables";
import {ModelUtils} from "../../model/model-utils";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {UserService} from "../../../user-mgmt/user.service";
import {CallStatus} from "../../../common/call-status";
import {Order} from "../../../catalogue/model/publish/order";
import {Router} from "@angular/router";
import {ItemInformationResponse} from "../../../catalogue/model/publish/item-information-response";
import {ItemInformationRequest} from "../../../catalogue/model/publish/item-information-request";
import {BinaryObject} from "../../../catalogue/model/publish/binary-object";
import {DocumentReference} from "../../../catalogue/model/publish/document-reference";
import {Attachment} from "../../../catalogue/model/publish/attachment";
import 'file-saver';
/**
 * Created by suat on 19-Nov-17.
 */
@Component({
    selector: 'item-information-request',
    templateUrl: './item-information-request.component.html'
})

export class ItemInformationRequestComponent {
    @Input() itemInformationRequest: ItemInformationRequest;
    @Input() itemInformationResponse: ItemInformationResponse;

    callStatus: CallStatus = new CallStatus();

    constructor(public bpeService: BPEService,
                public bpDataService: BPDataService,
                public userService: UserService,
                public cookieService: CookieService,
                public router: Router) {
    }

    selectItemSpecificationFile(event: any, documentReferenceArray:DocumentReference[]): void {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();

            reader.onload = function (e: any) {
                let base64String = reader.result.split(',').pop();
                let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                let document: DocumentReference = new DocumentReference();
                let attachment: Attachment = new Attachment();
                attachment.embeddedDocumentBinaryObject = binaryObject;
                document.attachment = attachment;
                documentReferenceArray.push(document);
            };
            reader.readAsDataURL(file);
        }
    }

    removeSelectedItemSpecificationFile(documentReferenceArray:DocumentReference[]): void {
        documentReferenceArray = [];
    }

    downloadTechnicalDataSheet(binaryObject:BinaryObject): void {
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

    sendInformationRequest() {
        this.callStatus.submit();
        let itemInformationRequest: ItemInformationRequest = JSON.parse(JSON.stringify(this.bpDataService.itemInformationRequest));

        // final check on the order
        itemInformationRequest.itemInformationRequestLine[0].salesItem[0].item = this.bpDataService.modifiedCatalogueLine.goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(itemInformationRequest);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId: string = this.bpDataService.catalogueLine.goodsItem.item.manufacturerParty.id;
        let buyerId: string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            itemInformationRequest.buyerCustomerParty = new CustomerParty(buyerParty)

            this.userService.getParty(sellerId).then(sellerParty => {
                itemInformationRequest.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars: ProcessVariables = ModelUtils.createProcessVariables("Item_Information_Request", buyerId, sellerId, itemInformationRequest);
                let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.callStatus.callback("Item Information Request sent", true);
                        this.router.navigate(['dashboard']);
                    })
                    .catch(error => {
                        this.callStatus.error("Failed to send Item Information Request");
                    });
            });
        });
    }

    sendInformationResponse() {
        let vars: ProcessVariables = ModelUtils.createProcessVariables("Item_Information_Request", this.bpDataService.itemInformationRequest.buyerCustomerParty.party.id, this.bpDataService.itemInformationRequest.sellerSupplierParty.party.id, this.bpDataService.itemInformationResponse);
        let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

        this.callStatus.submit();
        this.bpeService.continueBusinessProcess(piim).then(
            res => {
                this.callStatus.callback("Information Response sent", true);
                this.router.navigate(['dashboard']);
            }
        ).catch(
            error => this.callStatus.error("Failed to send Information Response")
        );
    }

    navigateToSearchDetails() {
        this.router.navigate(['/simple-search/details'],
            { queryParams: {
                catalogueId: this.bpDataService.catalogueLine.goodsItem.item.catalogueDocumentReference.id,
                id: this.bpDataService.catalogueLine.id,
                gid: this.bpDataService.getRelatedGroupId(),
                showOptions: true
            }});
    }
}
