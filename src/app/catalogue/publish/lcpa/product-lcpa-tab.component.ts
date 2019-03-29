import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {LcpaDetailModalComponent} from "./lcpa-detail-modal.component";
import {LifeCyclePerformanceAssessmentDetails} from "../../model/publish/life-cycle-performance-assessment-details";
import {LCPAInputDetail} from "../../model/publish/lcpa-input-detail";
import {LCPAInput} from "../../model/publish/lcpa-input";

@Component({
    selector: "product-lcpa-tab",
    templateUrl: "./product-lcpa-tab.component.html"
})
export class ProductLcpaTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean;
    @ViewChild(LcpaDetailModalComponent)
    private lcpaDetailModal: LcpaDetailModalComponent;
    lcpaDetails: LifeCyclePerformanceAssessmentDetails = new LifeCyclePerformanceAssessmentDetails();

    constructor() {
    }

    ngOnInit() {
        if(this.catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails == null) {
            this.catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails = this.lcpaDetails;
        } else {
            this.lcpaDetails = this.catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails;
            if(this.lcpaDetails.lcpainput == null) {
                this.lcpaDetails.lcpainput = new LCPAInput();
            }
        }
    }

    openLcpaDetailsModal(event: Event): void {
        // prevent navigation on clicking <a> element
        event.preventDefault();
        this.lcpaDetailModal.open();
    }

    onDetailSpecified(detail: LCPAInputDetail): void {
        this.catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpainput.additionalLCPAInputDetail.push(detail);
    }

    onDeleteDetail(detailIndex: number): void {
        this.catalogueLine.goodsItem.item.lifeCyclePerformanceAssessmentDetails.lcpainput.additionalLCPAInputDetail.splice(detailIndex, 1);
    }
}
