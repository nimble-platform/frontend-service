import {Component, Input, ViewChild,EventEmitter, Output} from "@angular/core";
import {LcpaDetailModalComponent} from "./lcpa-detail-modal.component";
import {LifeCyclePerformanceAssessmentDetails} from "../catalogue/model/publish/life-cycle-performance-assessment-details";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {LCPAInput} from "../catalogue/model/publish/lcpa-input";
import {MultiTypeValue} from "../catalogue/model/publish/multi-type-value";
import {Quantity} from "../catalogue/model/publish/quantity";
import {TranslateService} from '@ngx-translate/core';
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {Amount} from "../catalogue/model/publish/amount";
import {BinaryObject} from '../catalogue/model/publish/binary-object';
import {DocumentReference} from '../catalogue/model/publish/document-reference';
import {Attachment} from '../catalogue/model/publish/attachment';
import {CatalogueService} from '../catalogue/catalogue.service';
import {CallStatus} from '../common/call-status';

@Component({
    selector: "product-lcpa-tab",
    templateUrl: "./product-lcpa-tab.component.html",
    styleUrls: ['./product-lcpa-tab.component.css']
})
export class ProductLcpaTabComponent {

    @Input() disabled: boolean;
    @Input() presentationMode: 'view' | 'edit' = 'view';
    @Output() lcpaStatus = new EventEmitter<boolean>();

    @ViewChild(LcpaDetailModalComponent)
    private lcpaDetailModal: LcpaDetailModalComponent;
    downloadTemplateStatus:CallStatus = new CallStatus();
    selectedTab: 'INPUT' | 'RESULT' = 'INPUT';
    lcpaDetails: LifeCyclePerformanceAssessmentDetails = new LifeCyclePerformanceAssessmentDetails();
    _catalogueLine: CatalogueLine;

    // Pie Chart details
    results = [];
    scheme = {
        domain: ['#0000ff', '#ff4500']
    };

    constructor(
            private catalogueService: CatalogueService,
            private translate: TranslateService
            ) {
    }

    @Input()
    set catalogueLine(catalogueLine:CatalogueLine) {
        this._catalogueLine = catalogueLine;
        if(this._catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails == null) {
            this.lcpaStatus.emit(true);
            this._catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails = this.lcpaDetails;
        } else {
            this.lcpaDetails = this._catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails;
            if(this.lcpaDetails.lcpainput == null) {
                this.lcpaDetails.lcpainput = new LCPAInput();
            }
        }
        if(this.lcpaDetails.lcpaoutput){
            let total = this.lcpaDetails.lcpaoutput.opex.value + this.lcpaDetails.lcpaoutput.capex.value;
            let opex_perc = Math.round(this.lcpaDetails.lcpaoutput.opex.value*100/total);

            this.results.push({
                    "name": (100 - opex_perc) + "%", // CAPEX
                    "value": this.lcpaDetails.lcpaoutput.capex.value
                });
            this.results.push({
                "name": opex_perc +"%", // OPEX
                "value": this.lcpaDetails.lcpaoutput.opex.value
            })
        }
    }

    get catalogueLine(): CatalogueLine {
        return this._catalogueLine;
    }

    openLcpaDetailsModal(event: Event): void {
        // prevent navigation on clicking <a> element
        event.preventDefault();
        this.lcpaDetailModal.open();
    }

    onDetailSpecified(detail: MultiTypeValue): void {
        this._catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpainput.additionalLCPAInputDetail.push(detail);
    }

    onDeleteDetail(detailIndex: number): void {
        this._catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpainput.additionalLCPAInputDetail.splice(detailIndex, 1);
    }

    isVisible(quantity, type: 'QUANTITY'|'AMOUNT' = 'AMOUNT'): boolean {
        if(this.presentationMode == 'view') {
            if(type == 'QUANTITY') {
                if(UBLModelUtils.isEmptyOrIncompleteQuantity(quantity)) {
                    return false;
                }
            } else {
                if(UBLModelUtils.isEmptyOrIncompleteAmount(quantity)) {
                    return false;
                }
            }
        }
        return true;
    }

    isDisabled(): boolean {
        return this.disabled || this.presentationMode == 'view';
    }


    isEditMode(): boolean {
        return this.presentationMode == 'edit';
    }
    // functions for BOM
    getBOM(){
        for (let documentReference of this._catalogueLine.goodsItem.item.itemSpecificationDocumentReference) {
            if(documentReference.documentType == "BOM"){
                return [documentReference.attachment.embeddedDocumentBinaryObject];
            }
        }
        return [];
    }

    onSelectBOM(binaryObject: BinaryObject){
        const document: DocumentReference = new DocumentReference();
        document.documentType = "BOM";
        const attachment: Attachment = new Attachment();
        attachment.embeddedDocumentBinaryObject = binaryObject;
        document.attachment = attachment;

        this._catalogueLine.goodsItem.item.itemSpecificationDocumentReference.push(document);
    }

    onUnSelectBOM(binaryObject: BinaryObject){
        const i = this._catalogueLine.goodsItem.item.itemSpecificationDocumentReference.findIndex(doc => doc.attachment.embeddedDocumentBinaryObject === binaryObject);
        if(i >= 0) {
            this._catalogueLine.goodsItem.item.itemSpecificationDocumentReference.splice(i, 1);
        }
    }

    downloadTemplate() {

        this.downloadTemplateStatus.submit();

        var reader = new FileReader();
        this.catalogueService.downloadBOMTemplate()
            .then(result => {
                    var link = document.createElement('a');
                    link.id = 'downloadLink';
                    link.href = window.URL.createObjectURL(result.content);
                    link.download = result.fileName;

                    document.body.appendChild(link);
                    var downloadLink = document.getElementById('downloadLink');
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    this.downloadTemplateStatus.callback("Download completed");
                },
                error => {
                    this.downloadTemplateStatus.error("Download failed");
                });
    }

    onTabSelect(event:any, id:any): void {
        event.preventDefault();
        this.selectedTab = id;
    }
}
