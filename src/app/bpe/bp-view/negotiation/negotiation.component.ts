import {Component, OnInit} from "@angular/core";
import {BPDataService} from "../../bp-data-service";
import {CallStatus} from "../../../common/call-status";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})

export class NegotiationComponent implements OnInit {
	selectedTab: string = "Request for Quotation Details";

    constructor(private bpDataService:BPDataService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
			this.bpDataService.initRfq();
		}
	}
}