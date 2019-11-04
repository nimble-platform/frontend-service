import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as myGlobals from '../../globals';
import {UnitService} from '../../common/unit-service';
import {Quantity} from '../../catalogue/model/publish/quantity';
import {deliveryPeriodUnitListId, frameContractDurationUnitListId, warrantyPeriodUnitListId} from '../../common/constants';
import {INCOTERMS, PAYMENT_MEANS} from '../../catalogue/model/constants';
import {UBLModelUtils} from '../../catalogue/model/ubl-model-utils';
import {CallStatus} from '../../common/call-status';
import {DeliveryTerms} from '../../user-mgmt/model/delivery-terms';
import {Address} from '../../catalogue/model/publish/address';
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

    @Input() deliveryTermsOfBuyer: DeliveryTerms[];

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

    onDeleteTradingTerm(termName: string): void {
        // this.wrapper.deleteRfqTradingTerm(termName);
        // let termListsEqual: boolean = this.checkTradingTermListEquivalance();
        // if(termListsEqual) {
        //     this.custTermsDiffer = false;
        // }
    }
}
