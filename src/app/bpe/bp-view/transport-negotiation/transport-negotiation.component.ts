import { Component, OnInit } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import {RequestForQuotation} from '../../../catalogue/model/publish/request-for-quotation';
import {isTransportService} from '../../../common/utils';

@Component({
    selector: "transport-negotiation",
    templateUrl: "./transport-negotiation.component.html"
})
export class TransportNegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();
    // this component is used for both transport and logistics service negotiation
    // however, we need to know the type of service since some tabs in the child components are displayed only for transport services
    isTransportService:boolean;

    constructor(public bpDataService: BPDataService) {
    }

    ngOnInit() {
        this.isTransportService = isTransportService(this.bpDataService.getCatalogueLine());
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

    showNegotiationResponse(){
        let isCollaborationCancelled = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.collaborationStatus == 'CANCELLED';
        let isResponseSent = this.bpDataService.bpActivityEvent.processMetadata && this.bpDataService.bpActivityEvent.processMetadata.processStatus == 'Completed';
        return isResponseSent || (this.bpDataService.quotation && !isCollaborationCancelled);
    }
}
