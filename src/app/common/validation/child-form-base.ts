import {Input} from '@angular/core';
import {FormGroup} from '@angular/forms';

/**
 * Created by suat on 26-Dec-17.
 */
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
        if (this.formFieldName) {
            this.initializeForm();
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

    abstract initializeForm(): void;

    private getElementName(): string {
        return this.formFieldName + this.componentIndex;
    }
}
