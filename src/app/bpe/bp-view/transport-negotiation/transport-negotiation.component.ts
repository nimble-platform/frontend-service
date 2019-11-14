import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import {RequestForQuotation} from '../../../catalogue/model/publish/request-for-quotation';

@Component({
    selector: "transport-negotiation",
    templateUrl: "./transport-negotiation.component.html"
})
export class TransportNegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();

    constructor(public bpDataService: BPDataService) {
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

    async initRfq(): Promise<RequestForQuotation> {
        if(this.bpDataService.productOrder){
            this.bpDataService.initRfqForTransportationWithOrder(this.bpDataService.productOrder);
            return Promise.resolve(this.bpDataService.requestForQuotation);
        }
        return this.bpDataService.initRfq();
    }

    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }
}
