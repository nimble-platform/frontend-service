import {Component, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {CatalogueLine} from "../../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "../bp-data-service";
import {CURRENCIES} from "../../../catalogue/model/constants";
import {RequestForQuotation} from "../../../catalogue/model/publish/request-for-quotation";
import {RequestForQuotationLine} from "../../../catalogue/model/publish/request-for-quotation-line";
import {Location} from "@angular/common";
import {CallStatus} from "../../../common/call-status";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {BPEService} from "../../bpe.service";
import {UserService} from "../../../user-mgmt/user.service";
import {CookieService} from "ng2-cookies";
import {Router} from "@angular/router";
import {CustomerParty} from "../../../catalogue/model/publish/customer-party";
import {SupplierParty} from "../../../catalogue/model/publish/supplier-party";
import {NegotiationModelWrapper} from "./negotiation-model-wrapper";
import {copy, isValidPrice, roundToTwoDecimals} from "../../../common/utils";
import {PeriodRange} from "../../../user-mgmt/model/period-range";
import {DocumentService} from "../document-service";
import {DiscountModalComponent} from "../../../product-details/discount-modal.component";
import {ThreadEventMetadata} from "../../../catalogue/model/publish/thread-event-metadata";
import * as myGlobals from "../../../globals";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import {UnitService} from "../../../common/unit-service";
import {Party} from "../../../catalogue/model/publish/party";
import {Quantity} from "../../../catalogue/model/publish/quantity";
import {Quotation} from "../../../catalogue/model/publish/quotation";
import {Clause} from "../../../catalogue/model/publish/clause";
import {CustomTermModalComponent} from "./custom-term-modal.component";
import {TranslateService} from '@ngx-translate/core';
import {Item} from '../../../catalogue/model/publish/item';
import {NegotiationRequestItemComponent} from './negotiation-request-item.component';

@Component({
    selector: "negotiation-request",
    templateUrl: "./negotiation-request.component.html",
    styleUrls: ["./negotiation-request.component.css"],
})
export class NegotiationRequestComponent implements OnInit {

    CURRENCIES: string[] = CURRENCIES;

    /**
     * View data fields
     */

    @ViewChildren(NegotiationRequestItemComponent) viewChildren: QueryList<NegotiationRequestItemComponent>;
    @Input() selectedLine: CatalogueLine;
    catalogueLines: CatalogueLine[];
    rfq: RequestForQuotation;
    rfqLines: RequestForQuotationLine[];
    wrappers: NegotiationModelWrapper[];
    @Input() frameContracts: DigitalAgreement[];
    @Input() frameContractQuotations: Quotation[];
    // whether the frame contract is being negotiated in the negotiation workflow containing this request
    // this input is added in order to control the visibility of the frame contract option while loading terms.
    // frame contract option is disabled when displaying the history through which the contract is being negotiated.
    @Input() frameContractNegotiations: boolean[];
    @Input() lastOfferQuotation: Quotation;
    @Input() defaultTermsAndConditions: Clause[];
    frameContractDuration: Quantity = new Quantity(); // we have a dedicated variable to keep this in order not to create an empty trading term in the rfq

    sellerId:string = null;
    buyerId:string = null;
    deliverytermsOfBuyer = null;

    showPurchaseOrder:boolean = false;
    showNotesAndAdditionalFiles: boolean = false;

    /**
     * View control fields
     */
    @Input() manufacturersTermsSources: ('product_defaults' | 'frame_contract' | 'last_offer')[];
    counterOfferTermsSources: ('product_defaults' | 'frame_contract' | 'last_offer')[] = [];
    callStatus: CallStatus = new CallStatus();

    /**
     * Logic control fields
     */
    processMetadata: ThreadEventMetadata = null; // the copy of ThreadEventMetadata of the current business process
    processMetadataHistory: ThreadEventMetadata[];


    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;
    @ViewChild(CustomTermModalComponent)
    private customTermModal: CustomTermModalComponent;

    config = myGlobals.config;

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
                private unitService: UnitService,
                private cookieService: CookieService,
                private location: Location,
                private documentService: DocumentService,
                private translate: TranslateService,
                private router: Router) {

    }

    ngOnInit() {
        for(let manufacturersTermsSource of this.manufacturersTermsSources){
            this.counterOfferTermsSources.push(manufacturersTermsSource);
        }
        // Normally, this view is not displayed if the bpDataService.requestForQuotation is null.
        // However, it should also be checked here also for the second and later iterations of the negotiation business process.
        // In those cases, the negotiation component is not initialized again but only this component.
        if (this.bpDataService.requestForQuotation == null) {
            this.bpDataService.initRfqWithQuotation();
        }

        this.userService.getSettingsForParty(this.cookieService.get("company_id")).then(res => {
            this.deliverytermsOfBuyer = res.tradeDetails.deliveryTerms;
        });

        // get copy of ThreadEventMetadata of the current business process
        this.setProcessMetadataFields(this.bpDataService.bpActivityEvent.processHistory);

        // copying the original rfq so that the updates (which might be temporary) wouldn't effect the original document
        // if the document is updated, the cached one should be updated in the document service
        this.rfq = this.bpDataService.requestForQuotation;
        this.rfqLines = this.rfq.requestForQuotationLine;
        this.catalogueLines = this.bpDataService.getCatalogueLines();

        this.sellerId = UBLModelUtils.getPartyId(this.catalogueLines[0].goodsItem.item.manufacturerParty);
        this.buyerId = this.cookieService.get("company_id");

        // construct wrapper with the retrieved documents
        this.wrappers = [];
        let size = this.rfqLines.length;
        for(let i = 0; i <size;i++){
            this.wrappers.push(new NegotiationModelWrapper(
                this.getCatalogueLine(this.rfqLines[i].lineItem.item),
                this.rfq,
                null,
                this.frameContractQuotations[i],
                this.lastOfferQuotation,
                this.bpDataService.getCompanySettings().negotiationSettings,
                i));
        }
    }

    private getCatalogueLine(item:Item):CatalogueLine{
        for(let catalogueLine of this.catalogueLines){
            if(item.catalogueDocumentReference.id == catalogueLine.goodsItem.item.catalogueDocumentReference.id &&
                item.manufacturersItemIdentification.id == catalogueLine.goodsItem.item.manufacturersItemIdentification.id){
                return catalogueLine;
            }
        }
        return null;
    }

    private setProcessMetadataFields(processHistory: ThreadEventMetadata[]): void {
        this.processMetadataHistory = this.bpDataService.bpActivityEvent.processHistory;
        if(!this.bpDataService.bpActivityEvent.newProcess) {
            this.processMetadata = this.bpDataService.bpActivityEvent.processMetadata;
        }
    }

    /*
     * Event handlers
     */

    onSendRequest(): void {
        this.callStatus.submit();
        for(let wrapper of this.wrappers){
            if (wrapper.rfqDiscountPriceWrapper.itemPrice.hasPrice()) {
                if (!isValidPrice(wrapper.rfqDiscountPriceWrapper.itemPrice.price.priceAmount.value)) {
                    this.callStatus.callback("Terms aborted", true);
                    alert("Price cannot have more than 2 decimal places");
                    return;
                }
            }
        }

        if(!this.doesManufacturerOfferHasPrice() || this.isNegotiatingAnyTerm() || this.bpDataService.isFinalProcessInTheWorkflow("Negotiation")) {
            // create an additional trading term for the frame contract duration
            let negotiationRequestItemComponents = this.viewChildren.toArray();
            for(let negotiationRequestItemComponent of negotiationRequestItemComponents){
                let frameContractDuration = negotiationRequestItemComponent.getFrameContractDuration();
                if(!UBLModelUtils.isEmptyOrIncompleteQuantity(frameContractDuration)){
                    this.wrappers[negotiationRequestItemComponent.wrapper.lineIndex].rfqFrameContractDuration = frameContractDuration;
                }
            }

            // final check on the rfq
            const rfq: RequestForQuotation = copy(this.rfq);

            // send request for quotation
            let sellerParty: Party;
            let buyerParty: Party;
            Promise.all([
                this.userService.getParty(this.buyerId),
                this.userService.getParty(this.sellerId),

            ]).then(([buyerPartyResp, sellerPartyResp]) => {
                sellerParty = sellerPartyResp;
                buyerParty = buyerPartyResp;
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                return this.bpeService.startProcessWithDocument(rfq);

            }).then(() => {
                this.callStatus.callback("Terms sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

            }).catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            this.callStatus.callback("Terms sent", true);
            // set the item price, otherwise we will lose item price information
            for(let wrapper of this.wrappers){
                this.bpDataService.requestForQuotation.requestForQuotationLine[0].lineItem.price.priceAmount.value = wrapper.rfqDiscountPriceWrapper.totalPrice/wrapper.rfqDiscountPriceWrapper.orderedQuantity.value;
            }
            // just go to order page
            this.bpDataService.setCopyDocuments(true, false, false,false);
            this.bpDataService.proceedNextBpStep("buyer", "Order")
        }
    }

    onUpdateRequest(): void {
        this.callStatus.submit();

        let negotiationRequestItemComponents = this.viewChildren.toArray();
        for(let negotiationRequestItemComponent of negotiationRequestItemComponents){
            let frameContractDuration = negotiationRequestItemComponent.getFrameContractDuration();
            if(!UBLModelUtils.isEmptyOrIncompleteQuantity(frameContractDuration)){
                this.wrappers[negotiationRequestItemComponent.wrapper.lineIndex].rfqFrameContractDuration = frameContractDuration;
            }
        }

        const rfq: RequestForQuotation = copy(this.rfq);
        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processInstanceId).then(() => {
            this.documentService.updateCachedDocument(rfq.id,rfq);
            this.callStatus.callback("Terms updated", true);
            var tab = "PURCHASES";
            if (this.bpDataService.bpActivityEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});
        }).catch(error => {
            this.callStatus.error("Failed to update Terms", error);
        });
    }

    onBack(): void {
        this.location.back();
    }

    /*
     * Getters and setters for the template.
     */

    isNegotiatingAnyTerm(): boolean {
        if(this.viewChildren){
            let negotiationRequestItemComponents = this.viewChildren.toArray();
            for(let negotiationRequestItemComponent of negotiationRequestItemComponents){
                if(negotiationRequestItemComponent.isNegotiatingAnyTerm()){
                    return true;
                }
            }
        }
        return false;
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    isFormValid(): boolean {
        let formValid = /*!this.rfq.negotiationOptions.frameContractDuration ||*/ this.isFrameContractValid();
        formValid = formValid && this.isDeliveryPeriodValid() && this.isWarrantyPeriodValid();
        return formValid;
    }

    isFrameContractValid(): boolean {
        // either the frame contract duration should be empty indicating that it is not being negotiated
        // or it should be provided with both a value and a unit
        if(this.viewChildren){
            let negotiationRequestItemComponents = this.viewChildren.toArray();
            for(let negotiationRequestItemComponent of negotiationRequestItemComponents){
                let frameContractDuration = negotiationRequestItemComponent.getFrameContractDuration()
                if(!(UBLModelUtils.isEmptyQuantity(frameContractDuration) || !UBLModelUtils.isEmptyOrIncompleteQuantity(frameContractDuration))){
                    return false;
                }
            }
        }
        return true;
    }

    isWarrantyPeriodValid(): boolean {
        for(let wrapper of this.wrappers){
            const range = this.getWarrantyPeriodRange(wrapper);
            return !range || this.isPeriodValid(wrapper.rfqWarranty.value, range);
        }
    }

    private getWarrantyPeriodRange(wrapper:NegotiationModelWrapper): PeriodRange | null {
        const unit = wrapper.rfqWarranty.unitCode;
        const settings = wrapper.settings;

        const index = settings.warrantyPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.warrantyPeriodRanges[index] : null;
    }

    isDeliveryPeriodValid(): boolean {
        for(let wrapper of this.wrappers){
            const range = this.getDeliveryPeriodRange(wrapper);
            return !range || this.isPeriodValid(wrapper.rfqDeliveryPeriod.value, range);
        }

    }

    private isPeriodValid(value: number, range: PeriodRange): boolean {
        if(typeof value !== "number") {
            return true;
        }

        return value >= range.start && value <= range.end;
    }

    private getDeliveryPeriodRange(wrapper:NegotiationModelWrapper): PeriodRange | null {
        const unit = wrapper.rfqDeliveryPeriod.unitCode;
        const settings = wrapper.settings;

        const index = settings.deliveryPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.deliveryPeriodRanges[index] : null;
    }

    doesManufacturerOfferHasPrice(): boolean{
        let size = this.wrappers.length;
        for(let i = 0 ; i < size; i++){
            let wrapper = this.wrappers[i];
            if(this.counterOfferTermsSources[i] == 'last_offer' || this.counterOfferTermsSources[i] == 'frame_contract') {
                let quotationWrapper = wrapper.frameContractQuotationWrapper;
                if(this.counterOfferTermsSources[i] == 'last_offer') {
                    quotationWrapper = wrapper.lastOfferQuotationWrapper;
                }
                if(quotationWrapper.priceWrapper.itemPrice.pricePerItemString == "On demand"){
                    return false;
                }
            } else if(wrapper.lineDiscountPriceWrapper.discountedPricePerItemString == "On demand"){
                return false;
            }
        }

        return true;
    }

    /**
     * Internal methods
     */

    getQuantityUnit(catalogueLine:CatalogueLine): string {
        if(!catalogueLine) {
            return "";
        }
        return catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode || "";
    }

    isWaitingForReply(): boolean {
        return this.processMetadata && this.processMetadata.processStatus === "Started";
    }

    showRequestedPrice(): boolean {
        return this.isWaitingForReply() && !this.processMetadata.isBeingUpdated;
    }

    getTotalPriceString(){
        let totalPrice = 0;
        for(let wrapper of this.wrappers){
            totalPrice += wrapper.rfqTotal;
        }
        return roundToTwoDecimals(totalPrice) + " " + this.wrappers[0].currency;
    }

    getVatTotalString(){
        let vatTotal = 0;
        for(let wrapper of this.wrappers){
            vatTotal += wrapper.rfqVatTotal
        }
        return roundToTwoDecimals(vatTotal) + " " + this.wrappers[0].currency;
    }

    getGrossTotalString(){
        let grossTotal = 0;
        for(let wrapper of this.wrappers){
            grossTotal += wrapper.rfqGrossTotal;
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
