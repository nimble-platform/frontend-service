import {Component, OnInit} from "@angular/core";
import {RequestForQuotation} from "../model/ubl/request-for-quotation";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe.service";
import {ProcessVariables} from "../model/process-variables";
import {ProcessInstanceInputMessage} from "../model/process-instance-input-message";
import {UserService} from "../../user-mgmt/user.service";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {SupplierParty} from "../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../catalogue/model/publish/customer-party";
import {ModelUtils} from "../model/model-utils";
import {BPDataService} from "../bp-data-service";
import {CallStatus} from "../../common/call-status";
import {Quotation} from "../model/ubl/quotation";

@Component({
    selector: 'quotation',
    templateUrl: './quotation.component.html'
})

export class QuotationComponent implements OnInit {
	selectedTab: string = "Request for Quotation Details";
	callStatus:CallStatus = new CallStatus();

    constructor(private bpeService: BPEService,
                private bpDataService:BPDataService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
		if(this.bpDataService.requestForQuotation == null) {
			this.bpDataService.initRfq();
		}
	}

    sendRfq(): void {
		this.callStatus.submit();
		let rfq:RequestForQuotation = JSON.parse(JSON.stringify(this.bpDataService.requestForQuotation));

		// final check on the rfq
		rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLine.goodsItem.item;
		UBLModelUtils.removeHjidFieldsFromObject(rfq);

		//first initialize the seller and buyer parties.
		//once they are fetched continue with starting the ordering process
		let sellerId:string = this.bpDataService.catalogueLine.goodsItem.item.manufacturerParty.id;
		let buyerId:string = this.cookieService.get("company_id");

		this.userService.getParty(buyerId).then(buyerParty => {
			rfq.buyerCustomerParty = new CustomerParty(buyerParty)

			this.userService.getParty(sellerId).then(sellerParty => {
				rfq.sellerSupplierParty = new SupplierParty(sellerParty);
				let vars:ProcessVariables = ModelUtils.createProcessVariables("Negotiation", buyerId, sellerId, rfq);
				let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

				this.bpeService.startBusinessProcess(piim)
                    .then(res => {
						this.callStatus.callback("Terms Sent", true);
					})
                    .catch(error => {
						this.callStatus.error("Failed to Sent Terms");
					});
			});
		});
    }

	respondToRFQ() {
		let vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", this.bpDataService.requestForQuotation.buyerCustomerParty.party.id, this.bpDataService.requestForQuotation.sellerSupplierParty.party.id, this.bpDataService.quotation);
		let piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.bpDataService.processMetadata.process_id);

		this.callStatus.submit();
		this.bpeService.continueBusinessProcess(piim)
            .then(
            	res => this.callStatus.callback("Quotation sent", true)
			)
            .catch(
				error => this.callStatus.error("Failed to send quotation")
			);
	}
}