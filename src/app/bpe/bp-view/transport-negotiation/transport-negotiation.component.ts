import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { thresholdFreedmanDiaconis } from "d3";
import { SearchContextService } from "../../../simple-search/search-context.service";

@Component({
    selector: "transport-negotiation",
    templateUrl: "./transport-negotiation.component.html"
})
export class TransportNegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();

    constructor(public bpDataService: BPDataService,
                private searchContextService: SearchContextService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.initRfq()
                .then(() => {
                    this.initCallStatus.callback("Request for Quotation Initialized.");
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.", error);
                });
        }
    }

    initRfq(): Promise<void> {
        if(this.searchContextService.associatedProcessMetadata != null) {
            return this.bpDataService.initRfqForTransportationWithOrder();
        }
        return this.bpDataService.initRfq(null);
    }
    
    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }
}
