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
import { dateToString } from './utils';
import { ChildFormBase } from './validation/child-form-base';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { ValidationService } from './validation/validators';
const FIELD_NAME_DATE_VALUE = 'date';
@Component({
    selector: "date-input",
    templateUrl: "./date-input.component.html",
})
export class DateInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() valueDateClass: string = "";
    @Input() required = false;

    private dateValue: string;
    dateFormControl: FormControl;
    @Output() dateChange = new EventEmitter<string>();
    dateToString = dateToString;

    constructor(public validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        this.initViewFormAndAddToParentForm();
    }

    @Input()
    get date(): string {
        return this.dateValue;
    }

    set date(date: string) {
        if (date) {
            let index = date.indexOf("T");
            if (index != -1) {
                date = date.substring(0, date.indexOf("T"));
            }
        }
        this.dateValue = date;
        this.dateChange.emit(date);
    }

    initializeForm(): void {
        let validators: ValidatorFn[] = [];
        if (this.required) {
            validators.push(Validators.required);
        }
        this.dateFormControl = new FormControl(this.date, validators);
        this.addToCurrentForm(FIELD_NAME_DATE_VALUE, this.dateFormControl);
    }

    ngOnDestroy(): void {
        this.removeViewFormFromParentForm();
    }
}
