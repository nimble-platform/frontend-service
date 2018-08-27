import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address } from '../model/address';

@Component({
    moduleId: module.id,
    selector: 'address-form',
    templateUrl: 'address.component.html',
    styleUrls: ['address.component.css']
})
export class AddressSubForm {

    @Input('group')
    public addressForm: FormGroup;
	public disabledFlag = false;
	
	public static setDisabled(addressForm, flag) {
		addressForm.disabledFlag = flag;
	}

	public static get(addressForm): Address {
		return {
            streetName: addressForm.controls.streetName.value,
            buildingNumber: addressForm.controls.buildingNumber.value,
            cityName: addressForm.controls.cityName.value,
            postalCode: addressForm.controls.postalCode.value,
            country: addressForm.controls.country.value
        };
	}
	
    public static update(addressForm: FormGroup, address: Address): FormGroup {
        if (address) {
            addressForm.controls.streetName.setValue(address.streetName);
            addressForm.controls.buildingNumber.setValue(address.buildingNumber);
            addressForm.controls.cityName.setValue(address.cityName);
            addressForm.controls.postalCode.setValue(address.postalCode);
            addressForm.controls.country.setValue(address.country);
        }
        return addressForm;
    }

    public static generateForm(builder: FormBuilder) {
        let formDef = [''];
        return builder.group({
            streetName: formDef,
            buildingNumber: formDef,
            cityName: formDef,
            postalCode: formDef,
            country: formDef,
        });
    }
}
