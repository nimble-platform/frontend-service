import {Component, Input} from '@angular/core';
import * as myGlobals from '../globals';
import {RequestForQuotation} from "../bpe/model/request-for-quotation";
import {Terms} from "../bpe/model/request-for-quotation-terms";
import {CookieService} from "ng2-cookies";
import {BPEService} from "../bpe/bpe.service";

@Component({
    selector: 'negotiation-params',
    templateUrl: './negotiation-main.component.html'
})

export class NegotiationMainComponent {
    @Input() productResponse: any;

    terms: Terms = new Terms("", "", "", "", "");
    negotiatables = [];
	negotiationExpanded = false;
	submitted = false;
	callback = false;
	error_detc = false;

    constructor(private bpeService: BPEService,
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
		if (this.isJson(this.cookieService.get("negotiation_details"))) {
			var negDetails = JSON.parse(this.cookieService.get("negotiation_details"));
			if (this.isJson(negDetails.message)) {
				if (negDetails.product_id == this.productResponse.id) {
					var negParams = JSON.parse(negDetails.message);
					this.negotiationExpanded = true;
					this.terms.amount = negParams.amount;
					this.terms.price = negParams.price;
					for (let negSrc in negParams) {
						for (let negTar of this.negotiatables) {
							if (negTar.key == negSrc) {
								negTar.value = negParams[negSrc];
							}
						}
					}
				}
			}
		}
    }

	onKey(event: any) {
		for (let entry of this.negotiatables) {
			if (entry.key == event.target.name)
				entry.value = event.target.value;
		}
	}
	
    private sendRfq(): void {
		this.submitted = true;
        let rfq: RequestForQuotation = new RequestForQuotation("", "", "", "", "", "", "");
        this.terms.message = this.generateMessage();
        this.terms.product_id = this.productResponse.id.toString();
        this.terms.product_name = this.productResponse[myGlobals.product_name].toString();
        rfq.terms = JSON.stringify(this.terms);
        rfq.seller = this.productResponse[myGlobals.product_vendor_id].toString();
        rfq.sellerName = this.productResponse[myGlobals.product_vendor_name].toString();
        rfq.buyer = this.cookieService.get("company_id");
        rfq.buyerName = this.cookieService.get("user_fullname");
        rfq.connection = "|" + this.productResponse[myGlobals.product_vendor_id].toString() + "|" + this.cookieService.get("company_id") + "|";
        this.bpeService.sendRfq(rfq)
            .then(res => {
				this.error_detc = false;
				this.callback = true;
            })
            .catch(error => {
				this.error_detc = true;
            });
    }

    private generateMessage(): string {
        let msg = {}
		msg["amount"] = this.terms.amount;
		msg["price"] = this.terms.price;
		for (let entry of this.negotiatables) {
			msg[entry.key] = entry.value;
		}
        return JSON.stringify(msg);
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