import {Component, Input} from "@angular/core";
import {RequestForQuotation} from "../../../catalogue/model/publish/request-for-quotation";
import {BPDataService} from "../bp-data-service";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {ProcessVariables} from "../../model/process-variables";
import {ProcessInstanceInputMessage} from "../../model/process-instance-input-message";
import {ModelUtils} from "../../model/model-utils";
import {CookieService} from "ng2-cookies";
import {CallStatus} from "../../../common/call-status";
import {UserService} from "../../../user-mgmt/user.service";
import {BPEService} from "../../bpe.service";
import {Router} from "@angular/router";

@Component({
    selector: 'request-for-quotation',
    templateUrl: './request-for-quotation.component.html'
})

export class RequestForQuotationComponent {

	@Input() requestForQuotation:RequestForQuotation;

    callStatus:CallStatus = new CallStatus();
    // check whether 'Send Requested Terms' button is clicked or not
    submitted:boolean = false;
    constructor(private bpeService:BPEService,
                public bpDataService:BPDataService,
                private userService:UserService,
                private cookieService: CookieService,
                private router: Router) {
    }

    sendRfq(): void {
        this.submitted = true;
        this.callStatus.submit();
        let rfq:RequestForQuotation = JSON.parse(JSON.stringify(this.bpDataService.requestForQuotation));

        // final check on the rfq
        rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        UBLModelUtils.removeHjidFieldsFromObject(rfq);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        let sellerId:string = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.manufacturerParty.id;
        let buyerId:string = this.cookieService.get("company_id");

        this.userService.getParty(buyerId).then(buyerParty => {
            rfq.buyerCustomerParty = new CustomerParty(buyerParty);

            this.userService.getParty(sellerId).then(sellerParty => {
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);
                let vars:ProcessVariables = ModelUtils.createProcessVariables("Negotiation", buyerId, sellerId, rfq, this.bpDataService);
                let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

                this.bpeService.startBusinessProcess(piim)
                    .then(res => {
                        this.callStatus.callback("Terms sent", true);
                        this.router.navigate(['dashboard']);
                    })
                    .catch(error => {
                        this.submitted = false;
                        this.callStatus.error("Failed to sent Terms");
                    });
            });
        });
    }
}