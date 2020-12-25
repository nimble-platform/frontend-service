/*
 * Copyright 2020
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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {CountryUtil} from './country-util';
import {AbstractControl, FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {ChildFormBase} from './validation/child-form-base';
import {ValidationService} from './validation/validators';
import {TEXT_INPUT_FIELD_NAME} from './text-input.component';

@Component({
    selector: 'country-input',
    templateUrl: './country-input-component.html'
})
export class CountryInputComponent extends ChildFormBase implements OnInit, OnDestroy {

    @Input() valueClass: string;
    @Input() labelClass: string = 'col-3';
    @Input() required: boolean = false;
    @Input() readonly: boolean = false;
    @Input() formGroup: FormGroup;
    @Input() controlName: string;
    countryNameValue: string;

    @Input()
    get countryName(): string {
        return this.countryNameValue;
    }

    set countryName(text: string) {
        this.countryNameValue = text;
        this.countryNameChange.emit(text);
    }

    @Output() countryNameChange = new EventEmitter<string>();

    control: FormControl;

    constructor(private validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(50),
            distinctUntilChanged(),
            map(term => CountryUtil.getCountrySuggestions(term))
        );

    initializeForm(): void {
        let validators: ValidatorFn[] = [CountryUtil.validateCountry];
        if (this.required) {
            validators.push(Validators.required);
        }

        this.control = new FormControl(this.countryName, validators);
        this.formGroup.addControl(TEXT_INPUT_FIELD_NAME, this.control);
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        return this.validationService.getValidationErrorMessage(formControl);
    }
}
