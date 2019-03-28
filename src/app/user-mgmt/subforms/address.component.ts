import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Address } from '../model/address';
import { validateCountry, getCountrySuggestions } from '../../common/utils';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
    moduleId: module.id,
    selector: 'address-form',
    templateUrl: 'address.component.html',
    styleUrls: ['address.component.css']
})
export class AddressSubForm {

  @Input('group')
  public addressForm: FormGroup;
	@Input() disabledFlag: boolean = false;
  @Input() requiredFlag: boolean = true;

  getSuggestions = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(50),
      distinctUntilChanged(),
      map(term => getCountrySuggestions(term))
    );

	public static get(addressForm): Address {
		return {
            streetName: addressForm.controls.streetName.value,
            buildingNumber: addressForm.controls.buildingNumber.value,
            cityName: addressForm.controls.cityName.value,
            postalCode: addressForm.controls.postalCode.value,
            region: addressForm.controls.region.value,
            country: addressForm.controls.country.value
        };
	}

    public static update(addressForm: FormGroup, address: Address): FormGroup {
        if (address) {
            addressForm.controls.streetName.setValue(address.streetName || "");
            addressForm.controls.buildingNumber.setValue(address.buildingNumber || "");
            addressForm.controls.cityName.setValue(address.cityName || "");
            addressForm.controls.region.setValue(address.region || "");
            addressForm.controls.postalCode.setValue(address.postalCode || "");
            addressForm.controls.country.setValue(address.country || "");
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
            region: formDef,
            country: ['', [validateCountry] ]
        });
    }
}
