import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";
import {ThreadEventMetadata} from "../../../catalogue/model/publish/thread-event-metadata";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();
    negotiationProcessHistory: ThreadEventMetadata[] = [];
    sliderIndex: number = -1;
    companyNegotiationSettings: CompanyNegotiationSettings;

    constructor(public bpDataService: BPDataService) {
    }

    ngOnInit() {
        if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.bpDataService.initRfq(this.bpDataService.getCompanySettings().negotiationSettings)
                .then(() => {
                    this.initCallStatus.callback("Request for Quotation Initialized.");
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.", error);
                });
        }

        let history: ThreadEventMetadata[] = this.bpDataService.bpActivityEvent.processHistory;
        if(history) {
            for(let processMetadata of history) {
                if(processMetadata.processType == 'Negotiation') {
                    this.negotiationProcessHistory.push(processMetadata);
                }
            }
            this.sliderIndex = this.negotiationProcessHistory.length-1;
            console.log(this.negotiationProcessHistory.length);
        }
    }

    onSliderValueChange(sliderIndex: number): void {
        // if(this.negotiationProcessHistory[sliderIndex].)
        console.log(sliderIndex);
    }

    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }
}