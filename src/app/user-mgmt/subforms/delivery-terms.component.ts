import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressSubForm } from './address.component';
import { DeliveryTerms } from '../model/delivery-terms';
import { Address } from '../model/address';

@Component({
    moduleId: module.id,
    selector: 'delivery-terms-form',
    templateUrl: 'delivery-terms.component.html',
    styleUrls: ['delivery-terms.component.css']
})
export class DeliveryTermsSubForm {

    @Input('group') deliveryTermsForm: FormGroup;

	public static setAddress(deliveryTermsForm, address: Address) {
		AddressSubForm.update(deliveryTermsForm.controls.deliveryAddress, address);
	}
	
	public static getAddress(deliveryTermsForm): Address {
		return AddressSubForm.get(deliveryTermsForm.controls.deliveryAddress)
	}
	
    public static update(deliveryTermsForm: FormGroup, deliveryTerms: DeliveryTerms): FormGroup {
        deliveryTermsForm.controls.specialTerms.setValue(deliveryTerms.specialTerms);
        AddressSubForm.update(deliveryTermsForm.controls["deliveryAddress"] as FormGroup, deliveryTerms.deliveryAddress);
        deliveryTermsForm.controls.estimatedDeliveryTime.setValue(deliveryTerms.estimatedDeliveryTime);
        return deliveryTermsForm;
    }

    public static generateForm(builder: FormBuilder) {
        return builder.group({
            specialTerms: [''],
            deliveryAddress: AddressSubForm.generateForm(builder),
            estimatedDeliveryTime: ['', Validators.pattern('\\d+')] // only digits
        });
    }
}
