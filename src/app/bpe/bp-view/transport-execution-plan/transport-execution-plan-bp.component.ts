import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../bp-data-service";
import {SearchContextService} from "../../../simple-search/search-context.service";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'transport-execution-plan-bp',
    templateUrl: './transport-execution-plan-bp.component.html'
})

export class TransportExecutionPlanBpComponent implements OnInit {

    selectedTab: string = "Transport Execution Plan Request Details";

    constructor(private bpDataService: BPDataService,
                private searchContextService: SearchContextService) {
    }

    ngOnInit() {
        if (this.bpDataService.transportExecutionPlanRequest == null) {
            if(this.searchContextService.associatedProcessMetadata != null) {
                this.bpDataService.initTransportExecutionPlanRequestWithOrder(this.searchContextService.associatedProcessMetadata);
            } else {
                this.bpDataService.initTransportExecutionPlanRequest();
            }
        }
    }
}