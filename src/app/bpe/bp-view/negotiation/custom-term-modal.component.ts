import {Component, ElementRef, EventEmitter, Output, ViewChild} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Quantity} from "../../../catalogue/model/publish/quantity";
import {UBLModelUtils} from "../../../catalogue/model/ubl-model-utils";
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: "custom-term-modal",
    templateUrl: "./custom-term-modal.component.html"
})
export class CustomTermModalComponent {

    // emits the term details when the term is added
    @Output() onCustomTermAdded: EventEmitter<any> = new EventEmitter<any>();

    termName: string = '';
    termDescription: string = '';
    selectedDataType: string = 'TEXT';
    stringValue: string = '';
    numberValue: number;
    quantityValue: Quantity = new Quantity();

    @ViewChild("modal") modal: ElementRef;

    constructor(private modalService: NgbModal,private translate: TranslateService) {
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
        let termDetails: any = {};
        termDetails.name = this.termName;
        termDetails.description = this.termDescription;
        termDetails.value = value;
        termDetails.dataType = this.selectedDataType;
        this.onCustomTermAdded.emit(termDetails);
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
            if(!UBLModelUtils.isEmptyOrIncompleteQuantity(this.quantityValue)) {
                return true;
            }
        }
        return false;
    }
}
