/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Quantity } from "../catalogue/model/publish/quantity";
import { UnitService } from "./unit-service";
import { isCustomProperty, quantityToString } from "./utils";
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { ChildFormBase } from './validation/child-form-base';
import { ValidatorFn } from '@angular/forms/src/directives/validators';
import { stepValidator, ValidationService } from './validation/validators';
import { ItemProperty } from '../catalogue/model/publish/item-property';
import { PublishingPropertyService } from '../catalogue/publish/publishing-property.service';
import { FIELD_NAME_QUANTITY_VALUE } from './constants';

const FIELD_NAME_QUANTITY_UNIT = 'quantity_unit';

@Component({
    selector: "quantity-input",
    templateUrl: "./quantity-input.component.html",
    styleUrls: ["./quantity-input.component.css"],
})
export class QuantityInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() valueSizeClass: string = "col-7";
    @Input() unitSizeClass: string = "col-5";
    @Input() placeholder: string = "...";
    @Input() unitPlaceholder: string = "Unit";
    @Input() valueTextClass: string = "";

    @Input() quantity: Quantity;
    @Output() onQuantityValueChange = new EventEmitter<number>();
    @Output() onQuantityUnitChange = new EventEmitter<string>();
    @Input() quantityUnits?: string[];
    @Input() quantityType?: string;
    @Input() disableQuantityUnit: boolean = false;
    @Input() large: string = "false";
    innerFormClass = 'form-control-sm';

    // form validation inputs
    @Input() required = false;
    @Input() minimum: number;

    // target property for which this quantity holds value. it is used to get the associated units
    @Input() parentProperty: ItemProperty = null;

    // step logic
    _step = 1;
    @Input() set step(step: number) {
        step = step || 1;
        this._step = step;

        // when step is changed the form control of the number input should also change
        // however, if the quantity is not set yet, skip it as the form control depends on the quantity
        if (this.quantity) {
            this.initNumberInputFormControl();
        }
    }
    get step(): number {
        return this._step;
    }
    // end of step logic
    // end of form validation inputs

    quantityValueFormControl: FormControl;
    quantityUnitFormControl: FormControl;

    constructor(private unitService: UnitService,
        private publishingPropertyService: PublishingPropertyService,
        private validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }

        if (this.large == "true")
            this.innerFormClass = "";
        else
            this.innerFormClass = "form-control-sm";

        if (this.parentProperty && !isCustomProperty(this.parentProperty)) {
            this.publishingPropertyService.getCachedProperty(this.parentProperty.id).then(indexedProperty => {
                if (indexedProperty.codeList && indexedProperty.codeList.length > 0) {
                    this.quantityUnits = indexedProperty.codeList;
                }
            });
        } else if (this.quantityType) {
            this.unitService.getCachedUnitList(this.quantityType)
                .then(units => {
                    this.quantityUnits = units;
                    this.initQuantityUnit();
                })
        } else if (this.quantityUnits != null && this.quantityUnits.length > 0) {
            this.initQuantityUnit();
        }

        // initialize form controls
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
    }

    private initQuantityUnit(): void {
        if (this.quantity.unitCode == null && this.quantityUnits != null) {
            this.quantity.unitCode = this.quantityUnits[0];
        }
    }

    /**
     * form initializers
     */

    initializeForm(): void {
        this.initNumberInputFormControl();
        this.initUnitInputFormControl();
    }

    private initNumberInputFormControl(): void {
        let validators: ValidatorFn[] = [stepValidator(this.step)];
        if (this.minimum) {
            validators.push(Validators.min(this.minimum));
        }
        if (this.required) {
            validators.push(Validators.required);
            if (!this.minimum) {
                validators.push(Validators.min(1));
            }
        }

        this.quantityValueFormControl = new FormControl(this.quantity.value, validators);
        this.addToCurrentForm(FIELD_NAME_QUANTITY_VALUE, this.quantityValueFormControl);
    }

    private initUnitInputFormControl(): void {
        let validators: ValidatorFn[] = [];
        if (this.required) {
            validators.push(Validators.required);
        } else {
            if (this.quantity.value) {
                validators.push(Validators.required);
            }
        }

        this.quantityUnitFormControl = new FormControl(this.quantity.unitCode, validators);
        this.addToCurrentForm(FIELD_NAME_QUANTITY_UNIT, this.quantityUnitFormControl);
    }

    /**
     * template-related methods handlers
     */
    onQuantityValueChanged(value: number) {
        // this.updateUnitFormControlOnValueUpdate(value);
        this.initUnitInputFormControl();
        this.onQuantityValueChange.emit(value);
    }

    onQuantityUnitChanged(unit: string) {
        this.onQuantityUnitChange.emit(unit);
    }

    quantityToString(): string {
        return quantityToString(this.quantity);
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        return this.validationService.getValidationErrorMessage(formControl);
    }
}
