import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "../bp-data-service";
import { BpWorkflowOptions } from "../../model/bp-workflow-options";
import { Address } from "../../../catalogue/model/publish/address";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    @Input() line: CatalogueLine;
    // TODO change these...
    options: BpWorkflowOptions = new BpWorkflowOptions({}, 1000);
    deliveryText: string = "";
    address: Address = new Address();

    constructor(public bpDataService: BPDataService) {

    }

    ngOnInit() {
        // this.line = this.bpDataService.getCatalogueLine();
        // this.options = this.bpDataService.workflowOptions;
    }

    /*
     * Getters for the template.
     */

     getManufacturerWaranty(): string {
        const duration = this.line.warrantyValidityPeriod.durationMeasure.value;
        if(duration <= 0) {
            return "None";
        }
        return duration + " " + this.line.warrantyValidityPeriod.durationMeasure.unitCode;
     }
}
