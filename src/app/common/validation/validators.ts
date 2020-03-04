import {AbstractControl, FormControl, FormGroup, ValidatorFn} from '@angular/forms';
import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Address} from '../../catalogue/model/publish/address';

// validator constants
export const VALIDATION_ERROR_MULTIPLE = 'multiple';
export const VALIDATION_ERROR_MIN = 'min';
export const VALIDATION_REQUIRED = 'required';
export const VALIDATION_ERROR_PREFIX = 'validation_error_';
export const FORM_FIELD_PREFIX = 'form_field_';

export function stepValidator(step: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string} | null => {
        if (control.value !== undefined && (isNaN(control.value) || control.value % step !== 0)) {
            let minClosest: number = Math.floor(control.value / step ) * step;
            let errorKey: string = VALIDATION_ERROR_MULTIPLE;
            let error: any = {};
            error[errorKey] = {'step': step, 'minClosest': minClosest, 'maxClosest': (minClosest + step)};
            return error
        }
        return null;
    };
}

export function addressValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string} | null => {
        let address: Address = control.value;

        if (address.buildingNumber === '') {
            let errorKey: string = VALIDATION_ERROR_MULTIPLE;
            let error: any = {};
            error[errorKey] = {'invalidAddress': 'invalidBuildingNumber'};
            return error;
        }
        return null;
    };
}

@Injectable()
export class ValidationService {
    constructor(private translateService: TranslateService) {
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        let errorMessage = '';
        if (formControl && formControl.errors) {
            let errorKeys: string[] = Object.keys(formControl.errors);
            let firstError: string = errorKeys[0];

            switch (firstError) {
                case VALIDATION_ERROR_MULTIPLE: {
                    let formData: any = formControl.errors[VALIDATION_ERROR_MULTIPLE];
                    errorMessage = this.translateService.instant(VALIDATION_ERROR_PREFIX + VALIDATION_ERROR_MULTIPLE,
                        {step: formData.step, maxClosest: formData.maxClosest, minClosest: formData.minClosest});
                    return errorMessage;
                }
                case VALIDATION_ERROR_MIN: {
                    let formData: any = formControl.errors[VALIDATION_ERROR_MIN];
                    return this.translateService.instant(VALIDATION_ERROR_PREFIX + VALIDATION_ERROR_MIN,
                        {min: formData.min});
                }
                case VALIDATION_REQUIRED: {
                    return this.translateService.instant(VALIDATION_ERROR_PREFIX + VALIDATION_REQUIRED);
                }
            }
        }
        return errorMessage;
    }

    /**
     * recursively search the erroneous field inside the form controls
     */
    extractErrorMessage(form: FormGroup, fieldPath = ''): string {
        let errorPath: string = this.findPath(form, fieldPath);
        if (errorPath) {
            return this.translateService.instant('validation_provide_valid_input') + '\n' + errorPath;
        }
        return '';
    }

    private findPath(form: FormGroup, fieldPath = ''): string {
        if (!form.valid) {
            for (let fieldName of Object.keys(form.controls)) {
                let control: AbstractControl = form.controls[fieldName];
                if (!control.valid) {
                    // first remove the non alpha characters and translate
                    let labelKey: string = FORM_FIELD_PREFIX + fieldName.replace(/[^a-z_]/gi, '').toLowerCase();
                    let fieldLabel: string = this.translateService.instant(labelKey);
                    let newPath: string = fieldPath + ' / ' + fieldLabel;
                    if (control instanceof FormControl) {
                        return newPath;
                    } else {
                        return this.findPath(<FormGroup>control, newPath);
                    }
                }
            }
        }
        return '';
    }
}


