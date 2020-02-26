import {Input} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {ChildForm} from './child-form';

/**
 * Created by suat on 26-Dec-17.
 */
export abstract class ChildFormBase {
    // reference to the parent form to which the form managed by the component extending this base class
    @Input() parentForm: FormGroup;
    // contains the form controls for the component extending this base class
    formGroup: FormGroup = new FormGroup({});

    addViewFormToParentForm(elementName: string) {
        this.initializeForm();
        if (this.parentForm) {
            this.parentForm.removeControl(elementName);
            this.parentForm.addControl(elementName, this.formGroup);
        }
    }

    abstract initializeForm(): void;
}
