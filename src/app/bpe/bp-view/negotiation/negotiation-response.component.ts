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
import { ModelUtils } from "../../model/model-utils";
import { ProcessVariables } from "../../model/process-variables";
import { ProcessInstanceInputMessage } from "../../model/process-instance-input-message";
import { CallStatus } from "../../../common/call-status";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { BpUserRole } from "../../model/bp-user-role";
import {CookieService} from 'ng2-cookies';
import {DiscountModalComponent} from '../../../product-details/discount-modal.component';
import {BpStartEvent} from '../../../catalogue/model/publish/bp-start-event';
import {ThreadEventMetadata} from '../../../catalogue/model/publish/thread-event-metadata';
import {UBLModelUtils} from '../../../catalogue/model/ubl-model-utils';
import * as myGlobals from '../../../globals';
import {copy, isValidPrice} from "../../../common/utils";
import {DigitalAgreement} from "../../../catalogue/model/publish/digital-agreement";
import * as moment from "moment";
import {Moment, unitOfTime} from "moment";
import {Period} from "../../../catalogue/model/publish/period";

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {

    dateFormat = "YYYY-MM-DD";

    line: CatalogueLine;
    @Input() rfq: RequestForQuotation;
    @Input() quotation: Quotation;
    wrapper: NegotiationModelWrapper;
    userRole: BpUserRole;
    @Input() readonly: boolean = false;
    config = myGlobals.config;

    CURRENCIES: string[] = CURRENCIES;

    callStatus: CallStatus = new CallStatus();

    // the copy of ThreadEventMetadata of the current business process
    processMetadata: ThreadEventMetadata;

    @ViewChild(DiscountModalComponent)
    private discountModal: DiscountModalComponent;

    frameContract: DigitalAgreement;
    showFrameContractDetails: boolean = false;
    showNotesAndAdditionalFiles: boolean = false;
    showDeliveryAddress: boolean = false;

    constructor(private bpeService: BPEService,
                private bpDataService: BPDataService,
                private location: Location,
                private cookieService: CookieService,
                private router: Router) {

    }

    ngOnInit() {
        // get copy of ThreadEventMetadata of the current business process
        this.processMetadata = this.bpDataService.bpStartEvent.processMetadata;

        this.line = this.bpDataService.getCatalogueLine();
        if(this.rfq == null) {
            this.rfq = this.bpDataService.requestForQuotation;
        }
        if(this.quotation == null) {
            this.quotation = this.bpDataService.quotation;
        }
        this.bpDataService.computeRfqNegotiationOptionsIfNeededWithRfq(this.rfq);

        this.wrapper = new NegotiationModelWrapper(this.line, this.rfq, this.quotation,
            this.bpDataService.getCompanySettings().negotiationSettings);

        // we set removeDiscountAmount to false so that total price of rfq will not be changed
        this.wrapper.rfqPriceWrapper.removeDiscountAmount = false;
        // we set quotationPriceWrapper's presentationMode to be sure that the total price of quotation response will not be changed
        this.wrapper.quotationPriceWrapper.presentationMode = this.getPresentationMode();

        this.userRole = this.bpDataService.bpStartEvent.userRole;

        // check associated frame contract
        this.bpeService.getDigitalAgreement(UBLModelUtils.getPartyId(this.rfq.requestForQuotationLine[0].lineItem.item.manufacturerParty),
            UBLModelUtils.getPartyId(this.rfq.buyerCustomerParty.party),
            this.rfq.requestForQuotationLine[0].lineItem.item.manufacturersItemIdentification.id).then(digitalAgreement => {
            this.frameContract = digitalAgreement;
        });
    }

    onBack(): void {
        this.location.back();
    }

    onRespondToQuotation(accepted: boolean) {
        if (!isValidPrice(this.wrapper.quotationPriceWrapper.totalPrice)) {
            alert("Price cannot have more than 2 decimal places");
            return false;
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

        this.callStatus.submit();
        // create new frame contract
        let savedFrameContract: Promise<DigitalAgreement>;
        if(this.frameContract == null) {
            savedFrameContract = this.saveFrameContract()

            // update the frame contract
        } else {
            savedFrameContract = this.updateFrameContract();
        }

        savedFrameContract.then(contract => {
            let documentReference: DocumentReference = new DocumentReference();
            documentReference.documentType = 'FRAME_CONTRACT';
            documentReference.id = savedDigitalAgreement.id;
            this.quotation.additionalDocumentReference.push(documentReference);
            // the specfic item instance subject to this negotiation is already persisted while saving the the digital agreement. So, we should use it.
            this.quotation.requestForQuotationLine[0].lineItem.item = savedDigitalAgreement.item;
        });

        const vars: ProcessVariables = ModelUtils.createProcessVariables("Negotiation", UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.buyerCustomerParty.party),
            UBLModelUtils.getPartyId(this.bpDataService.requestForQuotation.sellerSupplierParty.party),this.cookieService.get("user_id"), this.quotation, this.bpDataService);
        const piim: ProcessInstanceInputMessage = new ProcessInstanceInputMessage(vars, this.processMetadata.processId);

        this.bpeService.continueBusinessProcess(piim).then(() => {
            this.callStatus.callback("Quotation sent", true);
            var tab = "PUCHASES";
            if (this.bpDataService.bpStartEvent.userRole == "seller")
                tab = "SALES";
            this.router.navigate(['dashboard'], {queryParams: {tab: tab}});

        }).catch(error => {
            this.callStatus.error("Failed to send quotation", error);
        });
    }

    onRequestNewQuotation() {
        this.bpDataService.initRfqWithQuotation();
        this.bpDataService.proceedNextBpStep("buyer", "Negotiation");
    }

    onAcceptAndOrder() {
        this.bpDataService.initOrderWithQuotation();
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

    isFrameContractPanelVisible(): boolean {
        return this.wrapper.rfqFrameContractDuration != null;
    }

    get quotationPrice(): number {
        return this.wrapper.quotationPriceWrapper.totalPrice;
    }

    set quotationPrice(price: number) {
        this.wrapper.quotationPriceWrapper.totalPrice = price;
    }

    getContractEndDate(): string {
        let rangeUnit: string;
        switch (this.wrapper.quotationFrameContractDuration.unitCode) {
            case "year(s)": rangeUnit = 'y'; break;
            case "month(s)": rangeUnit = 'M'; break;
            case "week(s)": rangeUnit = 'w'; break;
            case "day(s)": rangeUnit = 'd'; break;
        }
        let m:Moment = moment().add(this.wrapper.quotationFrameContractDuration.value, <unitOfTime.DurationConstructor>rangeUnit);
        let date: string = m.format(this.dateFormat);
        return date;
    }

    isFormValid(): boolean {
        // TODO check other elements
        return this.isFrameContractDurationValid();
    }

    /*
     * Internal Methods
     */

    hasUpdatedTerms(): boolean {
        if(this.rfq.negotiationOptions.deliveryPeriod) {
            if(!UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqDeliveryPeriod, this.wrapper.quotationDeliveryPeriod)) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.incoterms) {
            if(this.wrapper.rfqIncoterms !== this.wrapper.quotationIncoterms) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.paymentMeans) {
            if(this.wrapper.rfqPaymentMeans !== this.wrapper.quotationPaymentMeans) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.paymentTerms) {
            if(this.wrapper.rfqPaymentTerms !== this.wrapper.quotationPaymentTerms) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.price) {
            if(this.wrapper.rfqPriceWrapper.totalPriceString !== this.wrapper.quotationPriceWrapper.totalPriceString) {
                return true;
            }
        }
        if(this.rfq.negotiationOptions.warranty) {
            if(!UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqWarranty, this.wrapper.quotationWarranty)) {
                return true;
            }
        }
        if(!UBLModelUtils.areQuantitiesEqual(this.wrapper.rfqFrameContractDuration, this.wrapper.quotationFrameContractDuration)) {
            return true;
        }
        return false;
    }

    saveFrameContract(sellerParty: Party, buyerParty: Party): Promise<DigitalAgreement> {
        let frameContract: DigitalAgreement = new DigitalAgreement();
        frameContract.item = this.rfq.requestForQuotationLine[0].lineItem.item;
        frameContract.participantParty.push(this.rfq.sellerSupplierParty.party);
        frameContract.participantParty.push(this.rfq.buyerCustomerParty.party);

        frameContract.digitalAgreementTerms.validityPeriod.startDate = moment().format(this.dateFormat);
        frameContract.digitalAgreementTerms.validityPeriod.endDate = this.getContractEndDate();

        UBLModelUtils.removeHjidFieldsFromObject(frameContract);
        return this.bpeService.saveFrameContract(frameContract);
    }

    private updateFrameContract(): Promise<DigitalAgreement> {
        this.frameContract.digitalAgreementTerms.validityPeriod.startDate = moment().format(this.dateFormat);
        this.frameContract.digitalAgreementTerms.validityPeriod.endDate = this.getContractEndDate();

        return this.bpeService.updateFrameContract(this.frameContract);
    }

    private isFrameContractDurationValid(): boolean {
        if(this.frameContract.digitalAgreementTerms.validityPeriod.durationMeasure.unitCode != null &&
            this.frameContract.digitalAgreementTerms.validityPeriod.durationMeasure.value != null) {
            return true;
        }
        return false;
    }

    private openDiscountModal(): void{
        this.discountModal.open(this.wrapper.quotationPriceWrapper.appliedDiscounts,this.wrapper.quotationPriceWrapper.price.priceAmount.currencyID);
    }
}
