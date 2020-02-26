import {AbstractControl, FormGroup} from '@angular/forms';

export interface ChildForm {
    getViewFormControl(): AbstractControl;
    addViewFormToParentForm(elementName: string);
    // getErrors(): string[];
}