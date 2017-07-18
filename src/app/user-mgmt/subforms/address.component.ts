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


    public static update(addressForm, address: Address) {
        if (address) {
            addressForm.controls.streetName.setValue(address.streetName);
            addressForm.controls.buildingNumber.setValue(address.buildingNumber);
            addressForm.controls.cityName.setValue(address.cityName);
            addressForm.controls.postalCode.setValue(address.postalCode);
            addressForm.controls.country.setValue(address.country);
        }
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


