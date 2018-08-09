import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { SearchContextService } from "../../../simple-search/search-context.service";

@Component({
    selector: "transport-execution-plan",
    templateUrl: "./transport-execution-plan.component.html"
})
export class TransportExecutionPlanComponent implements OnInit {

    callStatus: CallStatus = new CallStatus();

    constructor(private bpDataService: BPDataService,
                private searchContextService: SearchContextService) {
        
    }

    ngOnInit() {
        if(!this.bpDataService.transportExecutionPlanRequest) {
            if(this.searchContextService.associatedProcessMetadata != null) {
                this.bpDataService.initTransportExecutionPlanRequestWithOrder();
            } else {
                this.bpDataService.initTransportExecutionPlanRequest();
            }
        }
    }
}
