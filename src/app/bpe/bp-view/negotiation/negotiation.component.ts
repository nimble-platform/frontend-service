import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { CallStatus } from "../../../common/call-status";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})

export class NegotiationComponent implements OnInit {

    initCallStatus:CallStatus = new CallStatus();

    constructor(private bpDataService:BPDataService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.bpDataService.initRfq()
                .then(() => {
                    this.initCallStatus.callback("Request for Quotation Initialized.");
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.");
                    console.log("Error while initializing request for quotation.", error);
                });
        }
	}
}