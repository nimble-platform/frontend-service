import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import * as myGlobals from '../../globals';
import {UnitService} from '../../common/unit-service';
import {Quantity} from '../../catalogue/model/publish/quantity';
import {deliveryPeriodUnitListId, frameContractDurationUnitListId, warrantyPeriodUnitListId} from '../../common/constants';
import {INCOTERMS, PAYMENT_MEANS} from '../../catalogue/model/constants';
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {CallStatus} from '../../common/call-status';
import {Address} from '../../catalogue/model/publish/address';
import {TradingTerm} from '../../catalogue/model/publish/trading-term';
import {NegotiationModelWrapper} from '../bp-view/negotiation/negotiation-model-wrapper';
import {CompanySettings} from '../../user-mgmt/model/company-settings';
import {CustomTermModalComponent} from '../bp-view/negotiation/custom-term-modal.component';
import {CommonTerms} from '../../common/common-terms';
/**
 * Created by suat on 31-Oct-19.
 */
@Component({
    selector: 'common-cart-terms',
    templateUrl: './common-cart-terms.component.html',
    styleUrls: ['./common-cart-terms.component.css']
})
export class CommonCartTermsComponent implements OnInit {

    config = myGlobals.config;
    PAYMENT_MEANS = PAYMENT_MEANS;
    PAYMENT_TERMS = UBLModelUtils.getDefaultPaymentTermsAsStrings();
    INCOTERMS = INCOTERMS;

    @Input() wrapper: NegotiationModelWrapper;
    @Input() buyerCompanySettings: CompanySettings;
    @Output() onApplyTermsEvent:EventEmitter<CommonTerms> = new EventEmitter();
    tradingTerms: TradingTerm[] = [];
    deliveryPeriodUnits: string[];
    deliveryPeriod: Quantity = new Quantity();
    warrantyPeriodUnits: string[];
    warrantyPeriod: Quantity = new Quantity();
    incoTerm: string = this.INCOTERMS[1];
    paymentTerm: string = this.PAYMENT_TERMS[0];
    paymentMean: string = this.PAYMENT_MEANS[0];
    frameContractDuration: Quantity = new Quantity();
    frameContractDurationUnits: string[];
    dataMonitoringRequested: boolean;
    deliveryAddress: Address = new Address();

    showGeneralTerms = true;
    showFrameContractDetails = false;
    showDataMonitoring = false;
    showDeliveryAddress = false;
    showTermsAndConditions = false;
    selectedTCTab: 'CUSTOM_TERMS' | 'CLAUSES' = 'CUSTOM_TERMS';

    initCallStatus: CallStatus = new CallStatus();
    @ViewChild(CustomTermModalComponent)
    private customTermModal: CustomTermModalComponent;

    constructor(private unitService: UnitService) {}

    ngOnInit() {
        this.initCallStatus.submit();
        Promise.all([this.unitService.getCachedUnitList(frameContractDurationUnitListId),
            this.unitService.getCachedUnitList(warrantyPeriodUnitListId),
            this.unitService.getCachedUnitList(deliveryPeriodUnitListId)]).then(([frameContractDurations, warrantyPeriods, deliveryPeriods]) => {

            this.frameContractDurationUnits = frameContractDurations;
            this.warrantyPeriodUnits = warrantyPeriods;
            this.deliveryPeriodUnits = deliveryPeriods;

            this.warrantyPeriod.unitCode = this.warrantyPeriodUnits[0];
            this.deliveryPeriod.unitCode = this.deliveryPeriodUnits[0];
            this.frameContractDuration.unitCode = this.frameContractDurationUnits[0];

            this.initCallStatus.callback(null, true);

        }).catch(err => {
            this.initCallStatus.error('Failed to retrieve units for terms');
        })
    }

    /**
     * event handlers
     */

    onApplyTerms(): void {
        if (confirm('Are you sure that you want to apply terms to all products?\nExisting terms will be overwritten.')) {
            let commonTerms:CommonTerms = new CommonTerms(this.deliveryPeriod,
                this.warrantyPeriod,
                this.incoTerm,
                this.paymentTerm,
                this.paymentMean,
                this.dataMonitoringRequested,
                this.frameContractDuration,
                this.deliveryAddress,
                this.tradingTerms,
                this.buyerCompanySettings.negotiationSettings.company.salesTerms.termOrCondition);
            this.onApplyTermsEvent.emit(commonTerms);
        }
    }

    onTCTabSelect(event: any, id: any): void {
        event.preventDefault();
        this.selectedTCTab = id;
    }

    onTabChange(tab: boolean): boolean {
        tab = !tab;
        this.showGeneralTerms = false;
        this.showFrameContractDetails = false;
        this.showDataMonitoring = false;
        this.showDeliveryAddress = false;
        this.showTermsAndConditions = false;
        return tab;
    }

    private onDeleteTradingTerm(termName: string): void {
        let indexToRemove = this.tradingTerms.findIndex(term => term.id === termName);
        if (indexToRemove !== -1) {
            this.tradingTerms.splice(indexToRemove, 1);
        }
    }

    private onCustomTermAdded(termName: string, termDescription: string, value, type: string): void {
        let tradingTerm: TradingTerm = this.tradingTerms.find(term => term.id === termName);
        if (tradingTerm != null) {
            return;
        } else {
            tradingTerm = UBLModelUtils.createTradingTerm(termName, termDescription, value, type);
            this.tradingTerms.push(tradingTerm);
        }
    }

    private openCustomTermModal(): void {
        this.customTermModal.open();
    }
}
