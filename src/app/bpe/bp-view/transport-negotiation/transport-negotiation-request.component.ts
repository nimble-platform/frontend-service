import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { INCOTERMS, PAYMENT_MEANS, CURRENCIES } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { PriceWrapper } from "../../../common/price-wrapper";
import { copy } from "../../../common/utils";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { CookieService } from "../../../../../node_modules/ng2-cookies";
import { UserService } from "../../../user-mgmt/user.service";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { BPEService } from "../../bpe.service";
import { Router } from "../../../../../node_modules/@angular/router";

@Component({
    selector: "transport-negotiation-request",
    templateUrl: "./transport-negotiation-request.component.html"
})
export class TransportNegotiationRequestComponent implements OnInit {

    rfq: RequestForQuotation;
    selectedTab: string = "OVERVIEW";
    rfqPrice: PriceWrapper;
    rfqPaymentTerms: PaymentTermsWrapper;

    callStatus: CallStatus = new CallStatus();

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    CURRENCIES: string[] = CURRENCIES;

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private cookieService: CookieService,
                private userService:UserService,
                private location: Location,
                private router: Router) {
        
    }

    ngOnInit() {
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqPrice = new PriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.paymentTerms);
    }

    isDisabled(): boolean {
        return this.isWaitingForReply() || this.callStatus.fb_submitted;
    }

    isWaitingForReply(): boolean {
        return !!this.bpDataService.processMetadata;
    }

    onSelectTab(event: any): void {
        event.preventDefault();
        this.selectedTab = event.target.id;
    }

    onBack(): void {
        this.location.back();
    }

    onSendRequest(): void {
        // send request for quotation
        this.callStatus.submit();
        let rfq: RequestForQuotation = copy(this.bpDataService.requestForQuotation);

        // final check on the rfq
        if(this.bpDataService.modifiedCatalogueLines) {
            // still needed when initializing RFQ with BpDataService.initRfqWithIir() or BpDataService.initRfqWithQuotation()
            // but this is a hack, the methods above should be fixed.
            rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        }

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
                        this.callStatus.error("Failed to sent Terms");
                        console.log("Error while sending terms", error);
                    });
            });
        });
    }
}
