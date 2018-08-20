import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();

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
    }

    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }
}