import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { CallStatus } from "../../../common/call-status";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { BpUserRole } from "../../model/bp-user-role";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})

export class NegotiationComponent implements OnInit {

    initCallStatus:CallStatus = new CallStatus();

    line: CatalogueLine;
    userRole: BpUserRole;
    quotation: Quotation;

    constructor(private bpDataService: BPDataService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
            this.initCallStatus.submit();
            this.bpDataService.initRfq()
                .then(() => {
                    this.initCallStatus.callback("Request for Quotation Initialized.");
                    this.line = this.bpDataService.getCatalogueLine();
                    this.userRole = this.bpDataService.userRole;
                    this.quotation = this.bpDataService.quotation;
                })
                .catch(error => {
                    this.initCallStatus.error("Error while initializing request for quotation.");
                    console.log("Error while initializing request for quotation.", error);
                });
        } else {
            this.line = this.bpDataService.getCatalogueLine();
            this.userRole = this.bpDataService.userRole;
            this.quotation = this.bpDataService.quotation;
        }
    }
    
    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }
}