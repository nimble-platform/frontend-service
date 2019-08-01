import {Component, ElementRef, Input, ViewChild} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Quantity} from "../../../catalogue/model/publish/quantity";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {NegotiationModelWrapper} from "./negotiation-model-wrapper";

@Component({
    selector: "custom-term-modal",
    templateUrl: "./custom-term-modal.component.html"
})
export class CustomTermModalComponent {

    @Input() negotiationModelWrapper: NegotiationModelWrapper;

    termName: string = '';
    termDescription: string = '';
    selectedDataType: string = 'TEXT';
    stringValue: string = '';
    numberValue: number;
    quantityValue: Quantity = new Quantity();

    @ViewChild("modal") modal: ElementRef;

    constructor(private modalService: NgbModal) {
    }

    open() {
        this.modalService.open(this.modal).result.then(() => {
            this.onAddCustomTerm();
        });
    }

    onAddCustomTerm(): void {
        let value;
        if(this.selectedDataType == 'TEXT') {
            value = this.stringValue;
        } else if(this.selectedDataType == 'NUMBER') {
            value = this.numberValue;
        } else  {
            value = this.quantityValue;
        }
        this.negotiationModelWrapper.addRfqTradingTerm(this.termName, this.termDescription, value, this.selectedDataType);
    }

    validValueSpecified(): boolean {
        if(this.selectedDataType == 'TEXT') {
            if(this.stringValue) {
                return true;
            }
        } else if(this.selectedDataType == 'NUMBER') {
            if(this.numberValue) {
                return true;
            }
        } else {
            if(!UBLModelUtils.isEmptyQuantity(this.quantityValue)) {
                return true;
            }
        }
        return false;
    }
}
