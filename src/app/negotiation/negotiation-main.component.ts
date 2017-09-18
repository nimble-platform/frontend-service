import {Component, Input} from '@angular/core';
import * as myGlobals from '../globals';
import {RequestForQuotation} from "../bpe/model/ubl/request-for-quotation";
import {Terms} from "../bpe/model/ubl/request-for-quotation-terms";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";
import {ProcessVariables} from "../bpe/model/process-variables";
import {ProcessInstanceInputMessage} from "../bpe/model/process-instance-input-message";
import {UserService} from "../user-mgmt/user.service";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {SupplierParty} from "../catalogue/model/publish/supplier-party";
import {CustomerParty} from "../catalogue/model/publish/customer-party";
import {ModelUtils} from "../bpe/model/model-utils";
import {LineReference} from "../catalogue/model/publish/line-reference";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {CatalogueService} from "../catalogue/catalogue.service";

@Component({
    selector: 'negotiation-params',
    templateUrl: './negotiation-main.component.html'
})

export class NegotiationMainComponent {
    @Input() catalogueLine:CatalogueLine;
	@Input() productResponse: any;

    rfq:RequestForQuotation = UBLModelUtils.createRequestForQuotation();
    negotiatables = [];
	negotiationExpanded = false;
	submitted = false;
	callback = false;
	error_detc = false;

    constructor(private bpeService: BPEService,
                private catalogueService: CatalogueService,
                private userService: UserService,
                private cookieService: CookieService) {
    }

    ngOnInit(): void {
        for (let entry in this.productResponse) {
            if (this.isNegotiable(entry)) {
                this.negotiatables.push({
                    "key": entry,
                    "value": this.productResponse[entry][0]
                });
            }
        }
        this.negotiatables.sort(function (a: any, b: any) {
            var a_comp = a.key;
            var b_comp = b.key;
            return a_comp.localeCompare(b_comp);
        });

		/*if (this.isJson(this.cookieService.get("negotiation_details"))) {
			var negDetails = JSON.parse(this.cookieService.get("negotiation_details"));
			if (this.isJson(negDetails.message)) {
				if (negDetails.product_id == this.productResponse.id) {
					var negParams = JSON.parse(negDetails.message);
					this.negotiationExpanded = true;
					this.rfq.amount = negParams.amount;
					this.rfq.price = negParams.price;
					for (let negSrc in negParams) {
						for (let negTar of this.negotiatables) {
							if (negTar.key == negSrc) {
								negTar.value = negParams[negSrc];
							}
						}
					}
				}
			}
		}*/
    }

	onKey(event: any) {
		for (let entry of this.negotiatables) {
			if (entry.key == event.target.name)
				entry.value = event.target.value;
		}
	}
	
    private sendRfq(): void {
		this.submitted = true;
		this.rfq.requestForQuotationLine[0].lineItem.item.name = this.productResponse[myGlobals.product_name].toString();
		this.rfq.requestForQuotationLine[0].lineItem.lineReference = [new LineReference(this.productResponse["item_id"][0])];

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

    private isNegotiable(property: string): boolean {
        var negotiatable = false;
        for (let field of myGlobals.negotiatables) {
            if (property.includes(field)) {
                negotiatable = true;
            }
        }
        return negotiatable;
    }
	
	isJson(str: string): boolean {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
	
}