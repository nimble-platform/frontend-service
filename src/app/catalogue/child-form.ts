import {Input} from "@angular/core";
import {AbstractControl, FormControl, FormGroup, Validators} from "@angular/forms";
/**
 * Created by suat on 26-Dec-17.
 */
export class ChildForm {
    @Input() parentForm: FormGroup = new FormGroup({}); // it'is initialized to an empty group as angular complains if a null form group is passed to a form element

    addToParentForm(elementName: string, control: AbstractControl) {
        if (this.parentForm) {
            setTimeout(() => {
                this.parentForm.addControl(elementName, control);
            });
        }
    }

    removeFromParentForm(elementName: string) {
        if (this.parentForm) {
            setTimeout(() => {
                this.parentForm.removeControl(elementName);
            });
        }
    }
}
