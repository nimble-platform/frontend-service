/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, ElementRef, EventEmitter, Output, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { UBLModelUtils } from "../../../catalogue/model/ubl-model-utils";

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

    constructor(private modalService: NgbModal) {
    }


    open() {
        this.reset();
        this.modalService.open(this.modal).result.then(() => {
            this.onAddCustomTerm();
        });
    }

    reset() {
        this.termName = "";
        this.termDescription = "";
        this.selectedDataType = 'TEXT';
        this.stringValue = "";
        this.numberValue = null;
        this.quantityValue = new Quantity();
    }

    onAddCustomTerm(): void {
        let value;
        if (this.selectedDataType == 'TEXT') {
            value = this.stringValue;
        } else if (this.selectedDataType == 'NUMBER') {
            value = this.numberValue;
        } else {
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
        if (this.selectedDataType == 'TEXT') {
            if (this.stringValue) {
                return true;
            }
        } else if (this.selectedDataType == 'NUMBER') {
            if (this.numberValue) {
                return true;
            }
        } else {
            if (!UBLModelUtils.isEmptyOrIncompleteQuantity(this.quantityValue)) {
                return true;
            }
        }
        return false;
    }
}
