import { Component, OnInit, Input } from "@angular/core";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { UserService } from "../../../user-mgmt/user.service";
import { CompanyNegotiationSettings } from "../../../user-mgmt/model/company-negotiation-settings";

@Component({
    selector: 'negotiation',
    templateUrl: './negotiation.component.html'
})
export class NegotiationComponent implements OnInit {

    initCallStatus: CallStatus = new CallStatus();

    companyNegotiationSettings: CompanyNegotiationSettings;

    constructor(public bpDataService: BPDataService,
                private userService: UserService) {
    }

    ngOnInit() {
        const promises: Promise<any>[] = [
            this.userService.getCompanyNegotiationSettingsForParty(
                this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty.id
            )
        ];
        if(this.bpDataService.requestForQuotation == null) {
            promises.push(this.bpDataService.initRfq())
        }

        this.initCallStatus.submit();
        Promise.all(promises)
            .then(([settings, _]) => {
                this.companyNegotiationSettings = settings;
                this.initCallStatus.callback("Request for Quotation Initialized.");
            })
            .catch(error => {
                this.initCallStatus.error("Error while initializing request for quotation.");
                console.log("Error while initializing request for quotation.", error);
            });
    }

    isLoading(): boolean {
        return this.initCallStatus.fb_submitted;
    }
}