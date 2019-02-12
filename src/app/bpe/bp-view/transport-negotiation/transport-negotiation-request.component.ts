import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { CookieService } from "ng2-cookies";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { INCOTERMS, PAYMENT_MEANS, CURRENCIES } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { PriceWrapper } from "../../../common/price-wrapper";
import { copy } from "../../../common/utils";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { UserService } from "../../../user-mgmt/user.service";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { ProcessVariables } from "../../model/process-variables";
import { ModelUtils } from "../../model/model-utils";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { BPEService } from "../../bpe.service";
import {ItemPriceWrapper} from '../../../common/item-price-wrapper';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';

@Component({
    selector: "transport-negotiation-request",
    templateUrl: "./transport-negotiation-request.component.html"
})
export class TransportNegotiationRequestComponent implements OnInit {

    rfq: RequestForQuotation;
    selectedTab: string = "OVERVIEW";
    rfqPrice: PriceWrapper;
    rfqPaymentTerms: PaymentTermsWrapper;
    updatingProcess: boolean = false;

    callStatus: CallStatus = new CallStatus();

    INCOTERMS: string[] = INCOTERMS;
    PAYMENT_MEANS: string[] = PAYMENT_MEANS;
    PAYMENT_TERMS: string[] = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    CURRENCIES: string[] = CURRENCIES;

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private cookieService: CookieService,
                private userService:UserService,
                private location: Location,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqPrice = new PriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPrice.quantityPrice = new ItemPriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.paymentTerms);
        if(this.processMetadata && this.processMetadata.isBeingUpdated){
            this.updatingProcess = true;
        }
    }

    isDisabled(): boolean {
        return this.isWaitingForReply() || this.callStatus.fb_submitted;
    }

    isWaitingForReply(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
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

        //console.log(rfq);

        let sellerId: string;

        // final check on the rfq
        if(this.bpDataService.modifiedCatalogueLines) {
            // still needed when initializing RFQ with BpDataService.initRfqWithIir() or BpDataService.initRfqWithQuotation()
            // but this is a hack, the methods above should be fixed.
            rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;

            sellerId = UBLModelUtils.getPartyId(this.bpDataService.modifiedCatalogueLines[0].goodsItem.item.manufacturerParty);
        }
        else {
            sellerId = UBLModelUtils.getPartyId(this.bpDataService.getCatalogueLine().goodsItem.item.manufacturerParty);
        }

        UBLModelUtils.removeHjidFieldsFromObject(rfq);

        //first initialize the seller and buyer parties.
        //once they are fetched continue with starting the ordering process
        const buyerId: string = this.cookieService.get("company_id");

        Promise.all([
            this.userService.getParty(buyerId),
            this.userService.getParty(sellerId)
        ])
        .then(([buyerParty, sellerParty]) => {
            rfq.buyerCustomerParty = new CustomerParty(buyerParty);
            rfq.sellerSupplierParty = new SupplierParty(sellerParty);

            const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", buyerId, sellerId,this.cookieService.get("user_id"), rfq, this.bpDataService);
            const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, "");

            return this.bpeService.startBusinessProcess(piim);
        })
        .then(() => {
            this.callStatus.callback("Terms sent", true);
            var tab = "PUCHASES";
            if (this.bpDataService.bpStartEvent.userRole == "seller")
              tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        })
        .catch(error => {
            this.callStatus.error("Failed to send Terms", error);
        });
    }

    onUpdateRequest(): void {
        this.callStatus.submit();
        let rfq: RequestForQuotation = copy(this.bpDataService.requestForQuotation);
        // final check on the rfq
        if(this.bpDataService.modifiedCatalogueLines) {
            // still needed when initializing RFQ with BpDataService.initRfqWithIir() or BpDataService.initRfqWithQuotation()
            // but this is a hack, the methods above should be fixed.
            rfq.requestForQuotationLine[0].lineItem.item = this.bpDataService.modifiedCatalogueLines[0].goodsItem.item;
        }

        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processId)
            .then(() => {
                this.callStatus.callback("Terms updated", true);
                var tab = "PUCHASES";
                if (this.bpDataService.bpStartEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Terms", error);
            });
    }
}
