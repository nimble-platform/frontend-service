import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressSubForm } from './address.component';
import { DeliveryTerms } from '../model/delivery-terms';

@Component({
    moduleId: module.id,
    selector: 'delivery-terms-form',
    templateUrl: 'delivery-terms.component.html',
    styleUrls: ['delivery-terms.component.css']
})
export class DeliveryTermsSubForm {

    @Input('group')
    public deliveryTermsForm: FormGroup;

    public static update(deliveryTermsForm, deliveryTerms: DeliveryTerms) {
        deliveryTermsForm.controls.specialTerms.setValue(deliveryTerms.specialTerms);
        AddressSubForm.update(deliveryTermsForm.controls.deliveryAddress, deliveryTerms.deliveryAddress);
        deliveryTermsForm.controls.estimatedDeliveryTime.setValue(deliveryTerms.estimatedDeliveryTime);
    }

    public static generateForm(builder: FormBuilder) {
        return builder.group({
            specialTerms: [''],
            deliveryAddress: AddressSubForm.generateForm(builder),
            estimatedDeliveryTime: ['', Validators.pattern('\\d+')], // only digits
        });
    }
}
