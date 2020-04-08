/*
 * Copyright 2020
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

import { Input } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

export abstract class ChildFormBase {
    // reference to the parent form to which the form managed by the component extending this base class
    @Input() parentForm: FormGroup;
    // element name to be used while attaching this form to the parent
    @Input() formFieldName: string;
    // the component index variable is required to identify each negotiation-request-item component when there is a list of those.
    // specifically, the index is required to register each component individually to the parent form so that the validation can be done for
    // each component individually.
    _componentIndex = -1;
    @Input() set componentIndex(value: number) {
        let oldIndex: number = this._componentIndex;
        // remove the form group from the parent before the component index is actually changed
        if (this.formFieldName) {
            this.removeViewFormFromParentForm();
            this._componentIndex = value;
            this.addViewFormToParentForm();
        } else {
            this._componentIndex = value;
        }
    }
    get componentIndex(): number {
        return this._componentIndex;
    }
    // name to be used while generating the error message
    formGroup: FormGroup = new FormGroup({});

    constructor(formFieldName?: string) {
        this.formFieldName = formFieldName;
    }

    initViewFormAndAddToParentForm(): void {
        this.initializeForm();
        if (this.parentForm) {
            this.addViewFormToParentForm();
        }
    }

    addViewFormToParentForm() {
        if (this.parentForm) {
            this.removeViewFormFromParentForm();
            this.parentForm.addControl(this.getElementName(), this.formGroup);
        }
    }

    removeViewFormFromParentForm() {
        if (this.parentForm) {
            this.parentForm.removeControl(this.getElementName());
        }
    }

    addToCurrentForm(formControlName: string, formControl: AbstractControl): void {
        if (this.formGroup.contains(formControlName)) {
            this.formGroup.removeControl(formControlName);
        }
        this.formGroup.addControl(formControlName, formControl);
    }

    abstract initializeForm(): void;

    // TODO all child form base implementations should implement ngOnDestroy and remove themselves from the parent form on being destroyed
    // abstract ngOnDestroy();

    private getElementName(): string {
        return this.formFieldName + this.componentIndex;
    }
}
