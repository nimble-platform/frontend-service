import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { BPDataService } from "../bp-data-service";
import { BpWorkflowOptions } from "../../model/bp-workflow-options";
import { Incoterms } from "../../../catalogue/model/publish/incoterms";
import { INCOTERMS } from "../../../catalogue/model/constants";

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    @Input() line: CatalogueLine;

    INCOTERMS: Incoterms[] = INCOTERMS;

    // TODO remove these
    deliveryText: string = "";
    options: BpWorkflowOptions = new BpWorkflowOptions({}, 1000);

    constructor(public bpDataService: BPDataService) {

    }

    ngOnInit() {
        // this.line = this.bpDataService.getCatalogueLine();
        // this.options = this.bpDataService.workflowOptions;

        // this.bpDataService.requestForQuotation.dataMonitoringRequested


        this.bpDataService.requestForQuotation.delivery.deliveryTerms.incoterms
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
