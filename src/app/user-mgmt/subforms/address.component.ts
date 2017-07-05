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
        addressForm.controls.streetName.setValue(address.streetName);
    }

    public static generateForm(builder: FormBuilder) {
        return builder.group({
            streetName: ['', Validators.required],
            buildingNumber: ['', Validators.required],
            cityName: ['', Validators.required],
            postalCode: ['', Validators.required],
            country: ['', Validators.required],
        });
    }
}


