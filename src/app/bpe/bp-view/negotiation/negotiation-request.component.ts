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
import {BpActivityEvent} from '../../../catalogue/model/publish/bp-start-event';
import {CompanySettings} from '../../../user-mgmt/model/company-settings';
import {FormGroup} from '@angular/forms';
import {ValidationService} from '../../../common/validation/validators';

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
    @Input() selectedLineIndex: number;
    @Input() catalogueLines: CatalogueLine[];
    @Input() sellerSettings: CompanySettings;

    @Input() rfq: RequestForQuotation;
    wrappers: NegotiationModelWrapper[];
    @Input() frameContracts: DigitalAgreement[];
    @Input() frameContractQuotations: Quotation[];
    // whether the frame contract is being negotiated in the negotiation workflow containing this request
    // this input is added in order to control the visibility of the frame contract option while loading terms.
    // frame contract option is disabled when displaying the history through which the contract is being negotiated.
    @Input() frameContractNegotiations: boolean[];
    @Input() lastOfferQuotation: Quotation;
    @Input() defaultTermsAndConditions: Clause[];
    // whether the process details are viewed for all products in the negotiation
    @Input() areProcessDetailsViewedForAllProducts:boolean;

    sellerId:string = null;
    buyerId:string = null;
    deliverytermsOfBuyer = null;

    showPurchaseOrder:boolean = false;
    showNotesAndAdditionalFiles: boolean = false;

    /**
     * View control fields
     */
    @Input() bpActivityEvent: BpActivityEvent;
    @Input() manufacturersTermsSources: ('product_defaults' | 'frame_contract' | 'last_offer')[];
    counterOfferTermsSources: ('product_defaults' | 'frame_contract' | 'last_offer')[] = [];
    negotiationRequestForm: FormGroup = new FormGroup({});
    callStatus: CallStatus = new CallStatus();

    /**
     * Logic control fields
     */
    processMetadata: ThreadEventMetadata = null; // the copy of ThreadEventMetadata of the current business process

    config = myGlobals.config;

    areNotesOrFilesAttachedToDocument = UBLModelUtils.areNotesOrFilesAttachedToDocument;

    VALIDATION_ERROR_FOR_FRAME_CONTRACT="validation_provide_valid_input_for_frame_contract";

    constructor(private bpDataService: BPDataService,
                private bpeService:BPEService,
                private userService:UserService,
                private unitService: UnitService,
                private validationService: ValidationService,
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
        this.userService.getSettingsForParty(this.cookieService.get("company_id")).then(res => {
            this.deliverytermsOfBuyer = res.tradeDetails.deliveryTerms;
        });

        if (this.bpActivityEvent && !this.bpActivityEvent.newProcess) {
            this.processMetadata = this.bpActivityEvent.processMetadata;
        }

        this.sellerId = UBLModelUtils.getPartyId(this.catalogueLines[0].goodsItem.item.manufacturerParty);
        this.buyerId = this.cookieService.get("company_id");

        // construct wrapper with the retrieved documents
        this.wrappers = [];
        let size = this.rfq.requestForQuotationLine.length;
        for(let i = 0; i <size;i++){
            this.wrappers.push(new NegotiationModelWrapper(
                this.getCatalogueLine(this.rfq.requestForQuotationLine[i].lineItem.item),
                this.rfq,
                null,
                this.frameContractQuotations[i],
                this.lastOfferQuotation,
                this.sellerSettings.negotiationSettings,
                i)
            );
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
            // final check on the rfq
            const rfq: RequestForQuotation = this.rfq;

            // send request for quotation
            let sellerParty: Party;
            let buyerParty: Party;
            Promise.all([
                this.userService.getParty(this.buyerId),
                this.userService.getParty(this.sellerId,this.catalogueLines[0].goodsItem.item.manufacturerParty.federationInstanceID),

            ]).then(([buyerPartyResp, sellerPartyResp]) => {
                sellerParty = sellerPartyResp;
                buyerParty = buyerPartyResp;
                rfq.buyerCustomerParty = new CustomerParty(buyerParty);
                rfq.sellerSupplierParty = new SupplierParty(sellerParty);

                return this.bpeService.startProcessWithDocument(rfq,sellerParty.federationInstanceID);

            }).then(() => {
                this.callStatus.callback("Terms sent", true);
                var tab = "PURCHASES";
                if (this.bpDataService.bpActivityEvent.userRole == "seller")
                    tab = "SALES";
                this.router.navigate(['dashboard'], {queryParams: {tab: tab,ins: sellerParty.federationInstanceID}});

            }).catch(error => {
                this.callStatus.error("Failed to send Terms", error);
            });
        } else {
            this.callStatus.callback("Terms sent", true);
            // set the item price, otherwise we will lose item price information
            for(let wrapper of this.wrappers){
                this.rfq.requestForQuotationLine[0].lineItem.price.priceAmount.value = wrapper.rfqDiscountPriceWrapper.totalPrice/wrapper.rfqDiscountPriceWrapper.orderedQuantity.value;
                // since we set priceAmount.value to total price/ordered quantity, base quantity value should be equal to 1
                // otherwise, we can not calculate the correct total price later
                this.rfq.requestForQuotationLine[0].lineItem.price.baseQuantity.value = 1;
                this.rfq.requestForQuotationLine[0].lineItem.price.baseQuantity.unitCode = wrapper.rfqDiscountPriceWrapper.orderedQuantity.unitCode;
            }
            // just go to order page
            this.bpDataService.setCopyDocuments(true, false, false,false);
            this.bpDataService.proceedNextBpStep("buyer", "Order")
        }
    }

    onUpdateRequest(): void {
        if(!this.areProcessDetailsViewedForAllProducts){
            alert("Please, make sure that you view the negotiation details of all products before sending your request!");
            return;
        }
        this.callStatus.submit();

        const rfq: RequestForQuotation = this.rfq;
        this.bpeService.updateBusinessProcess(JSON.stringify(rfq),"REQUESTFORQUOTATION",this.processMetadata.processInstanceId,this.processMetadata.sellerFederationId).then(() => {
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
        return this.areNotesOrFilesAttachedToDocument(this.rfq);
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    isReadOnly(): boolean {
        return !!this.processMetadata && !this.processMetadata.isBeingUpdated;
    }

    isFormValid(): boolean {
        let formValid =  this.isFrameContractValid() && this.negotiationRequestForm.valid;
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

    /*isWarrantyPeriodValid(): boolean {
        for(let wrapper of this.wrappers){
            const range = this.getWarrantyPeriodRange(wrapper);
            if(range && !this.isPeriodValid(wrapper.rfqWarranty.value, range)){
                return false;
            }
        }
        return true;
    }

    private getWarrantyPeriodRange(wrapper:NegotiationModelWrapper): PeriodRange | null {
        const unit = wrapper.rfqWarranty.unitCode;
        const settings = wrapper.sellerSettings;

        const index = settings.warrantyPeriodUnits.indexOf(unit);
        return index >= 0 ? settings.warrantyPeriodRanges[index] : null;
    }

    isDeliveryPeriodValid(): boolean {
        for(let wrapper of this.wrappers){
            const range = this.getDeliveryPeriodRange(wrapper);
            if(range && !this.isPeriodValid(wrapper.rfqDeliveryPeriod.value, range)){
                return false;
            }
        }
        return true;
    }

    areDeliveryDatesValid(): boolean{
        for(let wrapper of this.wrappers){
            for(let delivery of wrapper.rfqDelivery){
                let date = delivery.requestedDeliveryPeriod.endDate;
                let quantity = delivery.shipment.goodsItem[0].quantity;

                if(!(date == null && UBLModelUtils.isEmptyQuantity(quantity)) && !(date != null && !UBLModelUtils.isEmptyOrIncompleteQuantity(quantity))){
                    return false;
                }
            }
        }
        return true;
    }*/

    private isPeriodValid(value: number, range: PeriodRange): boolean {
        if(typeof value !== "number") {
            return true;
        }

        return value >= range.start && value <= range.end;
    }

    private getDeliveryPeriodRange(wrapper:NegotiationModelWrapper): PeriodRange | null {
        const unit = wrapper.rfqDeliveryPeriod.unitCode;
        const settings = wrapper.sellerSettings;

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

    getValidationError(): string {
        let errorMessage = this.validationService.extractErrorMessage(this.negotiationRequestForm);
        if(errorMessage == '' && !this.isFrameContractValid()){
            errorMessage = this.translate.instant(this.VALIDATION_ERROR_FOR_FRAME_CONTRACT)
        }
        return errorMessage;
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
        if(totalPrice == 0){
            return "On demand";
        }
        return roundToTwoDecimals(totalPrice) + " " + this.wrappers[0].currency;
    }

    getVatTotalString(){
        let vatTotal = 0;
        for(let wrapper of this.wrappers){
            vatTotal += wrapper.rfqVatTotal
        }
        if(vatTotal == 0){
            return "On demand";
        }
        return roundToTwoDecimals(vatTotal) + " " + this.wrappers[0].currency;
    }

    getGrossTotalString(){
        let grossTotal = 0;
        for(let wrapper of this.wrappers){
            grossTotal += wrapper.rfqGrossTotal;
        }
        if(grossTotal == 0){
            return "On demand";
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
