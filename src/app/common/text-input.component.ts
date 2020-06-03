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
import { LANGUAGES } from '../catalogue/model/constants';
import { TranslateService } from '@ngx-translate/core';
import { UBLModelUtils } from '../catalogue/model/ubl-model-utils';
import { ChildFormBase } from './validation/child-form-base';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { ValidatorFn } from '@angular/forms/src/directives/validators';
import { spaceValidator, ValidationService } from './validation/validators';

const TEXT_INPUT_FIELD_NAME = 'text';
@Component({
    selector: "text-input",
    templateUrl: "./text-input.component.html",
    styleUrls: ["./text-input.component.css"],
})
export class TextInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;
    @Input() forbiddenPrecedingTrailingSpace = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() flexClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() addButtonStyle: string = "";
    @Input() deleteButtonStyle: string = "";

    private textValue: string;
    private languageIdValue: string;
    @Input() languageIdClass: String = "";
    @Input() valueTextClass: string = "";
    @Input() textGeneratorClass: string = "";
    @Output() textChange = new EventEmitter<string>();
    @Output() languageIdChange = new EventEmitter<string>();
    @Output() addTextInput = new EventEmitter();
    @Output() deleteTextInput = new EventEmitter();
    @Input() rows: number = 3;
    @Input() maxLength: string = "255";
    @Input() isLink:boolean = false;

    textInputFormControl: FormControl;

    languages = LANGUAGES;

    constructor(private validationService: ValidationService,
        private translate: TranslateService) {
        super();
    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
    }

    @Input()
    get text(): string {
        if (this.presentationMode == "view") {
            let textBreaks = "";
            let textBreaksArr = [""];
            if (this.textValue && typeof (this.textValue) == "string") {
                textBreaksArr = this.textValue.split("\n");
            }
            if (textBreaksArr.length > 1)
                textBreaks = textBreaksArr.join("<br/>");
            else
                textBreaks = textBreaksArr[0];
            return textBreaks;
        }
        return this.textValue;
    }

    set text(text: string) {
        this.textValue = text;
        this.textChange.emit(text);
    }

    @Input()
    get languageId(): string {
        return this.languageIdValue;
    }

    set languageId(languageId: string) {
        this.languageIdValue = languageId;
        this.languageIdChange.emit(languageId);
    }

    onAddTextInput() {
        this.addTextInput.emit();
    }

    onDeleteTextInput() {
        this.deleteTextInput.emit();
    }

    generateText() {
        this.text = UBLModelUtils.generateUUID();
    }

    initializeForm(): void {
        let validators: ValidatorFn[] = [Validators.maxLength(Number(this.maxLength))];
        if (this.required) {
            validators.push(Validators.required);
        }
        if (this.forbiddenPrecedingTrailingSpace) {
            validators.push(spaceValidator());
        }

        this.textInputFormControl = new FormControl(this.text, validators);
        this.formGroup.addControl(TEXT_INPUT_FIELD_NAME, this.textInputFormControl);
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        return this.validationService.getValidationErrorMessage(formControl);
    }
}
