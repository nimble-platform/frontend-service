import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import {LifeCyclePerformanceAssessmentDetails} from "../model/publish/life-cycle-cost-details";

@Component({
    selector: "product-lcpa-tab",
    templateUrl: "./product-lcpa-tab.component.html"
})
export class ProductLcpaTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean;
    lcpaDetails: LifeCyclePerformanceAssessmentDetails = new LifeCyclePerformanceAssessmentDetails();

    constructor() {
    }

    ngOnInit() {
        if(this.catalogueLine.goodsItem.item.lifeCycleCostDetails == null) {
            this.catalogueLine.goodsItem.item.lifeCycleCostDetails = this.lcpaDetails;
        }
    }
}
