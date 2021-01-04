/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Address } from '../model/address';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import {CountryUtil} from '../../common/country-util';

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
    public static countryName:string = null;

    constructor(
        private translate: TranslateService
    ) {
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(50),
            distinctUntilChanged(),
            map(term => CountryUtil.getCountrySuggestions(term))
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
        this.countryName = addressForm.getRawValue()["country"];
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
            country: ['', [CountryUtil.validateCountryISOCode]]
        });
    }

    getCountryName(){
        return AddressSubForm.countryName;
    }

    onCountrySelected(event) {
        if(CountryUtil.validateCountrySimple(event.target.value)){
            AddressSubForm.countryName = event.target.value;
            // update the country form control
            this.addressForm.controls.country.setValue(CountryUtil.getISObyCountry(event.target.value));
            this.addressForm.markAsDirty();
        }
    }

}
