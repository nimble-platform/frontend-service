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

import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import {ChildFormBase} from './validation/child-form-base';
import {FormControl, ValidatorFn, Validators} from '@angular/forms';
import {ValidationService} from './validation/validators';
const FIELD_NAME_NUMBER = 'number';
@Component({
    selector: "plain-amount-input",
    templateUrl: "./plain-amount-input.component.html",
    styleUrls: ["./plain-amount-input.component.css"],
})
export class PlainAmountInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() required = false;
    _maxValue:number = null;

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() valueTextClass: string = "";

    private amountValue: number;
    amountFormControl: FormControl;
    @Output() amountChange = new EventEmitter<number>();
    @Input() amountUnit?: string;

    @Input()
    get amount(): number {
        return this.amountValue;
    }

    set amount(value: number) {
        this.amountValue = value;
        this.amountChange.emit(value);
    }

    constructor(public validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
    }

    initializeForm(): void {
        let validators:ValidatorFn[] = this.getValidators();

        this.amountFormControl = new FormControl(this.amount, validators);
        this.addToCurrentForm(FIELD_NAME_NUMBER, this.amountFormControl);
    }

    getValidators():ValidatorFn[]{
        let validators:ValidatorFn[] = [];
        if(this.required){
            validators.push(Validators.required);
        }
        if(this.maxValue !== null){
            validators.push(Validators.max(this.maxValue));
        }

        return validators;
    }

    @Input("maxValue")
    set maxValue(value:number){
        this._maxValue = value;
        if(this.amountFormControl){
            let validators:ValidatorFn[] = this.getValidators();
            // need to override existing validators for the from control
            this.amountFormControl.setValidators(validators);
            // check the validity of from control
            this.amountFormControl.updateValueAndValidity();
        }
    }

    get maxValue(){
        return this._maxValue;
    }
}
