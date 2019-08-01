import {Component, Input, ViewChild,EventEmitter, Output} from "@angular/core";
import {LcpaDetailModalComponent} from "./lcpa-detail-modal.component";
import {LifeCyclePerformanceAssessmentDetails} from "../catalogue/model/publish/life-cycle-performance-assessment-details";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {LCPAInput} from "../catalogue/model/publish/lcpa-input";
import {MultiTypeValue} from "../catalogue/model/publish/multi-type-value";
import {Quantity} from "../catalogue/model/publish/quantity";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {Amount} from "../catalogue/model/publish/amount";

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
    lcpaDetails: LifeCyclePerformanceAssessmentDetails = new LifeCyclePerformanceAssessmentDetails();
    _catalogueLine: CatalogueLine;

    constructor() {
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
                if(UBLModelUtils.isEmptyQuantity(quantity)) {
                    return false;
                }
            } else {
                if(UBLModelUtils.isEmptyAmount(quantity)) {
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
}
