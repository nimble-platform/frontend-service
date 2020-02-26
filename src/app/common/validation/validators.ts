import {AbstractControl, ValidatorFn} from '@angular/forms';
import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

// validator constants
export const VALIDATION_ERROR_MULTIPLE = 'multiple';
export const VALIDATION_ERROR_MIN = 'min';
export const VALIDATION_ERROR_PREFIX = 'validation_error_'

export function stepValidator(step: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string} | null => {
        if (control.value !== undefined && (isNaN(control.value) || control.value % step !== 0)) {
            let minClosest: number = Math.round(control.value / step ) * step;
            let errorKey: string = VALIDATION_ERROR_MULTIPLE;
            let error: any = {};
            error[errorKey] = {'step': step, 'minClosest': minClosest, 'maxClosest': (minClosest + step)};
            return error
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
            }
        }
        return errorMessage;
    }
}


