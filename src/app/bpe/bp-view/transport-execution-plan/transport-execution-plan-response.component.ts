import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { TransportExecutionPlan } from "../../../catalogue/model/publish/transport-execution-plan";
import { TransportExecutionPlanRequest } from "../../../catalogue/model/publish/transport-execution-plan-request";

@Component({
    selector: "transport-execution-plan-response",
    templateUrl: "./transport-execution-plan-response.component.html"
})
export class TransportExecutionPlanResponseComponent implements OnInit {

    request: TransportExecutionPlanRequest;
    response: TransportExecutionPlan;

    callStatus: CallStatus = new CallStatus();

    constructor(private bpDataService: BPDataService) {
        
    }

    ngOnInit() {
        // TODO
    }
}
