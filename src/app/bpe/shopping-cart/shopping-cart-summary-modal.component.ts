import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {TranslateService} from '@ngx-translate/core';
import * as myGlobals from '../../globals';
import {quantityToString, roundToTwoDecimals} from '../../common/utils';
import {NegotiationModelWrapper} from '../bp-view/negotiation/negotiation-model-wrapper';

@Component({
    selector: "shopping-cart-summary-modal",
    templateUrl: "./shopping-cart-summary-modal.component.html",
    styleUrls: ['./shopping-cart-summary-modal.component.css']
})
export class ShoppingCartSummaryModalComponent {

    @ViewChild("modal") modal: ElementRef;
    // Inputs
    @Input() negotiationModelWrappers:NegotiationModelWrapper[];

    // Outputs
    @Output() onMultipleLineNegotiation = new EventEmitter();

    config = myGlobals.config;

    quantityToString = quantityToString;

    constructor(private translate: TranslateService,
                private modalService: NgbModal) {
    }

    open() {
        this.modalService.open(this.modal,{windowClass: 'large-modal'});
    }

    onNegotiation(c: any){
        this.onMultipleLineNegotiation.emit();
        c();
    }

    getTotalPriceString(){
        let totalPrice = 0;
        for(let negotiationModelWrapper of this.negotiationModelWrappers){
            totalPrice += negotiationModelWrapper.rfqTotal;
        }
        return roundToTwoDecimals(totalPrice) + " " + this.negotiationModelWrappers[0].currency;
    }

    getVatTotalString(){
        let vatTotal = 0;
        for(let negotiationModelWrapper of this.negotiationModelWrappers){
            vatTotal += negotiationModelWrapper.rfqVatTotal;
        }
        return roundToTwoDecimals(vatTotal) + " " + this.negotiationModelWrappers[0].currency;
    }

    getGrossTotalString(){
        let grossTotal = 0;
        for(let negotiationModelWrapper of this.negotiationModelWrappers){
            grossTotal += negotiationModelWrapper.rfqGrossTotal;
        }
        return roundToTwoDecimals(grossTotal) + " " + this.negotiationModelWrappers[0].currency;
    }
}
