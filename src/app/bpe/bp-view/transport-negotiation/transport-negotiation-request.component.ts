import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { CookieService } from "ng2-cookies";
import { BPDataService } from "../bp-data-service";
import { CallStatus } from "../../../common/call-status";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { INCOTERMS, PAYMENT_MEANS, CURRENCIES } from "../../../catalogue/model/constants";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";
import { copy } from "../../../common/utils";
import { PaymentTermsWrapper } from "../payment-terms-wrapper";
import { UserService } from "../../../user-mgmt/user.service";
import { CustomerParty } from "../../../catalogue/model/publish/customer-party";
import { SupplierParty } from "../../../catalogue/model/publish/supplier-party";
import { BPEService } from "../../bpe.service";
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {DiscountPriceWrapper} from "../../../common/discount-price-wrapper";
import {Text} from '../../../catalogue/model/publish/text';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "transport-negotiation-request",
    templateUrl: "./transport-negotiation-request.component.html"
})
export class TransportNegotiationRequestComponent implements OnInit {

    rfq: RequestForQuotation;
    selectedTab: string = "OVERVIEW";
    rfqPrice: DiscountPriceWrapper;
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
                private translate: TranslateService,
                private router: Router) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;

        this.rfq = this.bpDataService.requestForQuotation;
        this.validateRfq();
        this.rfqPrice = new DiscountPriceWrapper(
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.rfq.requestForQuotationLine[0].lineItem.price,
            this.bpDataService.getCatalogueLine().requiredItemLocationQuantity.applicableTaxCategory[0].percent);
        //this.rfqPrice.quotationLinePriceWrapper = new ItemPriceWrapper(this.rfq.requestForQuotationLine[0].lineItem.price);
        this.rfqPaymentTerms = new PaymentTermsWrapper(this.rfq.paymentTerms);
        if(this.processMetadata && this.processMetadata.isBeingUpdated){
            this.updatingProcess = true;
        }
    }

    // be sure that rfq has all necessary fields to start a bp
    validateRfq(){
        // special terms
        if(this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms == null || this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms.length == 0){
            this.rfq.requestForQuotationLine[0].lineItem.deliveryTerms.specialTerms.push(new Text(""));
        }
    }

    isDisabled(): boolean {
        return this.isWaitingForReply() || this.callStatus.fb_submitted;
    }

    isWaitingForReply(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
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

            return this.bpeService.startProcessWithDocument(rfq);
        })
        .then(() => {
            this.callStatus.callback("Terms sent", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
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

        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processInstanceId)
            .then(() => {
                this.callStatus.callback("Terms updated", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                  tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
            })
            .catch(error => {
                this.callStatus.error("Failed to update Terms", error);
            });
    }
}
