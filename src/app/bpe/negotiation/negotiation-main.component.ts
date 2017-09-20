import {Component, Input, OnInit} from '@angular/core';
import * as myGlobals from '../../globals';
import {RequestForQuotation} from "../model/ubl/request-for-quotation";
import {Terms} from "../model/ubl/request-for-quotation-terms";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe.service";
import {ProcessVariables} from "../model/process-variables";
import {ProcessInstanceInputMessage} from "../model/process-instance-input-message";
import {UserService} from "../../user-mgmt/user.service";
import {UBLModelUtils} from "../../catalogue/model/ubl-model-utils";
import {SupplierParty} from "../../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../../catalogue/model/publish/customer-party";
import {ModelUtils} from "../model/model-utils";
import {LineReference} from "../../catalogue/model/publish/line-reference";
import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "../bp-data-service";

@Component({
    selector: 'negotiation-params',
    templateUrl: './negotiation-main.component.html'
})

export class NegotiationMainComponent implements OnInit {
    @Input() catalogueLine:CatalogueLine;
	@Input() productResponse: any;

	rfq:RequestForQuotation;

	selectedTab: string = "Product Details";
	negotiationExpanded = false;
	submitted = false;
	callback = false;
	error_detc = false;

    constructor(private bpeService: BPEService,
                private bpDataService:BPDataService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
    	this.bpDataService.initRfq(this.catalogueLine);
		this.rfq = this.bpDataService.requestForQuotation;
	}

    sendRfq(): void {
		this.submitted = true;

		// final check on the rfq
		this.bpDataService.chooseFirstValuesOfItemProperties("Negotiation");
		this.bpDataService.chooseAllDimensions("Negotiation");
		UBLModelUtils.removeHjidFieldsFromObject(this.rfq);

		//first initialize the seller and buyer parties.
		//once they are fetched continue with starting the ordering process
		let sellerId:string = this.productResponse[myGlobals.product_vendor_id].toString();
		let buyerId:string = this.cookieService.get("company_id");

		this.userService.getParty(buyerId).then(buyerParty => {
			this.rfq.buyerCustomerParty = new CustomerParty(buyerParty)

			this.userService.getParty(sellerId).then(sellerParty => {
				this.rfq.sellerSupplierParty = new SupplierParty(sellerParty);
				let vars:ProcessVariables = ModelUtils.createProcessVariables("Negotiation", buyerId, sellerId, this.rfq);
				let piim:ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

				this.bpeService.startBusinessProcess(piim)
                    .then(res => {
						this.error_detc = false;
						this.callback = true;
					})
                    .catch(error => {
						this.error_detc = true;
					});
			});
		});
    }
}