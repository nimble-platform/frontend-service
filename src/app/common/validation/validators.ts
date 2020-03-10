import {AbstractControl, FormControl, FormGroup, RequiredValidator, ValidatorFn, Validators} from '@angular/forms';
import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {FIELD_NAME_PRODUCT_PRICE_AMOUNT, FIELD_NAME_PRODUCT_PRICE_BASE_QUANTITY, FIELD_NAME_QUANTITY_VALUE} from '../constants';
import {PeriodRange} from '../../user-mgmt/model/period-range';

// validator constants
export const VALIDATION_ERROR_MULTIPLE = 'multiple';
export const VALIDATION_ERROR_MIN = 'min';
export const VALIDATION_INVALID_PERIOD = 'invalid_period';
export const VALIDATION_REQUIRED = 'required';
const VALIDATION_ERROR_PREFIX = 'validation_error_';
const FORM_FIELD_PREFIX = 'form_field_';

export function stepValidator(step: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string} | null => {
        if (step >= 1 && control.value !== undefined && (isNaN(control.value) || control.value % step !== 0)) {
            let minClosest: number = Math.floor(control.value / step ) * step;
            let errorKey: string = VALIDATION_ERROR_MULTIPLE;
            let error: any = {};
            error[errorKey] = {'step': step, 'minClosest': minClosest, 'maxClosest': (minClosest + step)};
            return error
        }
        return null;
    };
}

export function priceValidator(formGroup: FormGroup): any {
    let priceAmountFormControl: AbstractControl = formGroup.controls[FIELD_NAME_PRODUCT_PRICE_AMOUNT];
    let priceBaseQuantityFormGroup: FormGroup;
    for (let fieldKey of Object.keys(formGroup.controls)) {
        if (fieldKey.startsWith(FIELD_NAME_PRODUCT_PRICE_BASE_QUANTITY)) {
            priceBaseQuantityFormGroup = <FormGroup>formGroup.controls[fieldKey];
            break;
        }
    }
    // base quantity group is not available yet
    if (priceBaseQuantityFormGroup == null) {
        return null;
    }
    // if the price is set, base quantity should also be set
    if (priceAmountFormControl.value) {
        if (!priceBaseQuantityFormGroup.controls[FIELD_NAME_QUANTITY_VALUE].value) {
            priceBaseQuantityFormGroup.controls[FIELD_NAME_QUANTITY_VALUE].setErrors({'required': true});
            return {'invalidBaseQuantity': true}
        } else {
            deleteError(priceBaseQuantityFormGroup.controls[FIELD_NAME_QUANTITY_VALUE], 'required');
        }
    } else {
        deleteError(priceBaseQuantityFormGroup.controls[FIELD_NAME_QUANTITY_VALUE], 'required');

    }
    return null;
}

export function periodValidator(selectedUnitFormControl: FormControl, periodUnits, periods: PeriodRange[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string} | null => {
        let index = periodUnits.indexOf(selectedUnitFormControl.value);
        let periodRange: PeriodRange = index >= 0 ? periods[index] : null;

        if (periodRange && control.value != null && !(control.value >= periodRange.start && control.value <= periodRange.end)) {
            let errorKey: string = VALIDATION_INVALID_PERIOD;
            let error: any = {};
            error[errorKey] = {'start': periodRange.start, 'end': periodRange.end};
            return error
        }
        return null;
    };
}

function deleteError(formControl: AbstractControl, errorToDelete: string): void {
    let errors: any = formControl.errors;
    // if errors is not null or empty
    if (errors && Object.keys(errors).length !== 0) {
        delete errors[errorToDelete];
    }
    if (!errors || Object.keys(errors).length === 0) {
        errors = null;
    }
    formControl.setErrors(errors);
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
                case VALIDATION_INVALID_PERIOD: {
                    let formData: any = formControl.errors[VALIDATION_INVALID_PERIOD];
                    errorMessage = this.translateService.instant(VALIDATION_ERROR_PREFIX + VALIDATION_INVALID_PERIOD,
                        {start: formData.start, end: formData.end});
                    return errorMessage;
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
        return fieldPath;
    }
}


