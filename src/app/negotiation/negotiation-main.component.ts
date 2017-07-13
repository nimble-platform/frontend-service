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

export class NegotationMainComponent {
    @Input() productResponse: any;

    terms: Terms = new Terms("", "", "", "", "");
    negotiatables = [];

    constructor(private bpeService: BPEService,
                private cookieService: CookieService) {
    }

    ngOnInit(): void {
        for (let entry in this.productResponse) {
            if (this.isNegotiable(entry)) {
                this.negotiatables.push({
                    "key": entry,
                    "value": this.productResponse[entry]
                });
            }
        }
        this.negotiatables.sort(function (a: any, b: any) {
            var a_comp = a.key;
            var b_comp = b.key;
            return a_comp.localeCompare(b_comp);
        });
    }

    private sendRfq(): void {
        let rfq: RequestForQuotation = new RequestForQuotation("", "", "", "", "", "", "");
        this.terms.message = this.generateMessage();
        this.terms.product_id = this.productResponse.id.toString();
        this.terms.product_name = this.productResponse[myGlobals.product_name].toString();
        rfq.terms = JSON.stringify(this.terms);
        rfq.seller = this.productResponse[myGlobals.product_vendor_id].toString();
        rfq.sellerName = this.productResponse[myGlobals.product_name].toString();
        rfq.buyer = this.cookieService.get("company_id");
        rfq.buyerName = this.cookieService.get("user_fullname");
        rfq.connection = "|" + this.productResponse[myGlobals.product_vendor_id].toString() + "|" + this.cookieService.get("company_id") + "|";
        this.bpeService.sendRfq(rfq)
            .then(res => {

            })
            .catch(error => {

            });
    }

    private generateMessage(): string {
        let msg = {}
        for (let field of myGlobals.negotiatables) {
            if (this.terms[field] != null) {
                msg[field] = JSON.parse(JSON.stringify(this.terms))[field];
            }
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
}