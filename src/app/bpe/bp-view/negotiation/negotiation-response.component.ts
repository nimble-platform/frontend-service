import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { Location } from "@angular/common";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import { RequestForQuotation } from "../../../catalogue/model/publish/request-for-quotation";
import { BPDataService } from "../bp-data-service";
import { BPEService } from "../../bpe.service";
import { Router } from "@angular/router";
import { Quotation } from "../../../catalogue/model/publish/quotation";
import { NegotiationModelWrapper } from "./negotiation-model-wrapper";
import { NEGOTIATION_RESPONSES, CURRENCIES } from "../../../catalogue/model/constants";
import { CallStatus } from "../../../common/call-status";
import { BpUserRole } from "../../model/bp-user-role";
import {CookieService} from 'ng2-cookies';
import {DiscountModalComponent} from '../../../product-details/discount-modal.component';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';
import * as myGlobals from '../../../globals';
import {isValidPrice, roundToTwoDecimals} from '../../../common/utils';
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import {Clause} from '../../../catalogue/model/publish/clause';
import {TranslateService} from '@ngx-translate/core';
import {Item} from '../../../catalogue/model/publish/item';

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {

    lines: CatalogueLine[];
    @Input() selectedLine: CatalogueLine;
    @Input() rfq: RequestForQuotation;
    @Input() quotation: Quotation;
    @Input() lastOfferQuotation: Quotation;
    @Input() frameContractQuotations: Quotation[];
    @Input() frameContracts: DigitalAgreement[];
    @Input() frameContractNegotiations: boolean[];
    @Input() defaultTermsAndConditions: Clause[];
    @Input() primaryTermsSources: ('product_defaults' | 'frame_contract' | 'last_offer')[];
    @Input() readonly: boolean = false;
    // whether the item is deleted or not
    // if the item is deleted, then we will not show Product Defaults section since we do not have those information
    @Input() areCatalogueLinesDeleted:boolean[] ;
    wrappers: NegotiationModelWrapper[];
    userRole: BpUserRole;
    config = myGlobals.config;

    showPurchaseOrder:boolean = false;
    showNotesAndAdditionalFiles:boolean = false;

    CURRENCIES: string[] = CURRENCIES;

    callStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    getPartyId = UBLModelUtils.getPartyId;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private translate: TranslateService,
                private router: Router) {
    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;
        this.lines = this.bpDataService.getCatalogueLines();
        if(this.rfq == null) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        if(this.quotation == null) {
            this.quotation = this.bpDataService.quotation;
        }

        this.wrappers = [];
        let size = this.rfq.requestForQuotationLine.length;
        for(let i = 0 ; i < size; i++){
            this.wrappers.push(new NegotiationModelWrapper(
                this.getCatalogueLine(this.rfq.requestForQuotationLine[i].lineItem.item),
                this.rfq,
                this.quotation,
                this.frameContractQuotations ? this.frameContractQuotations[i] : null,
                this.lastOfferQuotation,
                this.bpDataService.getCompanySettings().negotiationSettings,
                i));
        }

        for(let wrapper of this.wrappers){
            wrapper.lineDiscountPriceWrapper.itemPrice.value = wrapper.lineDiscountPriceWrapper.discountedPricePerItem;
        }

        this.userRole = this.bpDataService.bpActivityEvent.userRole;
    }

    onBack(): void {
        this.location.back();
    }

    private getCatalogueLine(item:Item):CatalogueLine{
        for(let catalogueLine of this.lines){
            if(item.catalogueDocumentReference.id == catalogueLine.goodsItem.item.catalogueDocumentReference.id &&
                item.manufacturersItemIdentification.id == catalogueLine.goodsItem.item.manufacturersItemIdentification.id){
                return catalogueLine;
            }
        }
        return null;
    }

    isCatalogueLineDeleted(catalogueLine:CatalogueLine){
        return this.areCatalogueLinesDeleted[this.lines.indexOf(catalogueLine)];
    }
    onRespondToQuotation(accepted: boolean) {
        this.callStatus.submit();

        for(let wrapper of this.wrappers){
            if (!isValidPrice(wrapper.quotationDiscountPriceWrapper.totalPrice)) {
                this.callStatus.callback("Quotation aborted", true);
                alert("Price cannot have more than 2 decimal places");
                return false;
            }
        }

        if(accepted) {
            if(this.hasUpdatedTerms()) {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.TERMS_UPDATED;
            } else {
                this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.ACCEPTED;
            }
        } else {
            this.quotation.documentStatusCode.name = NEGOTIATION_RESPONSES.REJECTED;
        }

        //this.callStatus.submit();

        this.bpeService.startProcessWithDocument(this.quotation).then(() => {
            this.callStatus.callback("Quotation sent", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

        }).catch(error => {
            this.callStatus.error("Failed to send quotation", error);
        });
    }

    onRequestNewQuotation() {
        this.bpDataService.setCopyDocuments(true, true, false,false);
        this.bpDataService.proceedNextBpStep("buyer", "Negotiation");
    }

    onAcceptAndOrder() {
        this.bpDataService.setCopyDocuments(true, true, false,false);
        this.bpDataService.proceedNextBpStep("buyer", "Order");
    }

    /*
     * Getters and Setters
     */

    isLoading(): boolean {
        return false;
    }

    isDisabled(): boolean {
        return this.isLoading() || this.readonly;
    }

    getPresentationMode(): "edit" | "view" {
        return this.isReadOnly() ? "view" : "edit";
    }

    isReadOnly(): boolean {
        return this.processMetadata == null || this.processMetadata.processStatus !== 'Started' || this.readonly;
    }

    isFormValid(): boolean {
        // TODO check other elements
        return this.isFrameContractDurationValid();
    }

    isPriceValid(): boolean {
        for(let wrapper of this.wrappers){
            if(wrapper.quotationDiscountPriceWrapper.totalPrice <= 0){
                return false;
            }
        }
        return true;
    }

    isRequestNewQuotationDisabled(): boolean {
        return this.isLoading() || this.isThereADeletedProduct() || this.processMetadata.isCollaborationFinished;
    }

    isAcceptAndOrderDisabled(): boolean {
        return this.isLoading() ||
            this.isThereADeletedProduct() ||
            !this.isPriceValid() ||
            this.processMetadata.isCollaborationFinished ||
            this.quotation.documentStatusCode.name === 'Rejected' ||
            this.bpDataService.isFinalProcessInTheWorkflow('Negotiation');
    }

    isThereADeletedProduct():boolean{
        for(let isProductDeleted of this.areCatalogueLinesDeleted){
            if(isProductDeleted){
                return true;
            }
        }
        return false;
    }

    /*
     * Internal Methods
     */

    hasUpdatedTerms(): boolean {
        for(let wrapper of this.wrappers){
            if(!UBLModelUtils.areQuantitiesEqual(wrapper.rfqDeliveryPeriod, wrapper.newQuotationWrapper.deliveryPeriod)) {
                return true;
            }
            if(wrapper.rfqIncoterms !== wrapper.newQuotationWrapper.incoterms) {
                return true;
            }
            if(wrapper.rfqPaymentMeans !== wrapper.newQuotationWrapper.paymentMeans) {
                return true;
            }
            if(wrapper.rfqPaymentTerms.paymentTerm !== wrapper.newQuotationWrapper.paymentTermsWrapper.paymentTerm) {
                return true;
            }
            if(wrapper.rfqDiscountPriceWrapper.totalPriceString !== wrapper.quotationDiscountPriceWrapper.totalPriceString) {
                return true;
            }
            if(!UBLModelUtils.areQuantitiesEqual(wrapper.rfqWarranty, wrapper.newQuotationWrapper.warranty)) {
                return true;
            }
            if(!UBLModelUtils.areQuantitiesEqual(wrapper.rfqFrameContractDuration, wrapper.newQuotationWrapper.frameContractDuration)) {
                return true;
            }
            if(UBLModelUtils.areTermsAndConditionListsDifferent(wrapper.rfq.requestForQuotationLine[wrapper.lineIndex].lineItem.clause, wrapper.newQuotation.quotationLine[wrapper.lineIndex].lineItem.clause)) {
                return true;
            }
        }


        return false;
    }

    private isFrameContractDurationValid(): boolean {
        if(this.frameContracts){
            for(let frameContract of this.frameContracts){
                if(frameContract.digitalAgreementTerms.validityPeriod.durationMeasure.unitCode == null ||
                    frameContract.digitalAgreementTerms.validityPeriod.durationMeasure.value == null) {
                    return false;
                }
            }
        }
        return true;
    }

    getTotalPriceString(){
        let totalPrice = 0;
        for(let wrapper of this.wrappers){
            totalPrice += wrapper.newQuotationWrapper.priceWrapper.totalPrice;
        }
        return roundToTwoDecimals(totalPrice) + " " + this.wrappers[0].currency;
    }

    getVatTotalString(){
        let vatTotal = 0;
        for(let wrapper of this.wrappers){
            vatTotal += wrapper.newQuotationWrapper.priceWrapper.vatTotal;
        }
        return roundToTwoDecimals(vatTotal) + " " + this.wrappers[0].currency;
    }

    getGrossTotalString(){
        let grossTotal = 0;
        for(let wrapper of this.wrappers){
            grossTotal += wrapper.newQuotationWrapper.priceWrapper.grossTotal;
        }
        return roundToTwoDecimals(grossTotal) + " " + this.wrappers[0].currency;
    }

    showTab(tab:boolean):boolean {
        let ret = true;
        if (tab)
            ret = false;
        this.showNotesAndAdditionalFiles = false;
        this.showPurchaseOrder = false;
        return ret;
    }
}
