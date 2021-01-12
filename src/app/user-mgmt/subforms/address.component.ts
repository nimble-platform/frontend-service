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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Address } from '../model/address';
import {Observable, Subject} from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {CountryUtil} from '../../common/country-util';
import {Coordinate} from '../../catalogue/model/publish/coordinate';
import {addressToString} from '../utils';
import 'rxjs/add/operator/takeUntil';

@Component({
    moduleId: module.id,
    selector: 'address-form',
    templateUrl: 'address.component.html',
    styleUrls: ['address.component.css']
})


export class AddressSubForm implements OnInit,OnDestroy{

    @Input('group')
    public addressForm: FormGroup;
    @Input() disabledFlag: boolean = false;
    @Input() requiredFlag: boolean = true;
    @Input() mapView: boolean = false;
    // location coordinate used in the address map
    coordinate:Coordinate;
    // address as string
    addressString:string;

    ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
    ) {
    }

    ngOnInit(): void {
        // set coordinate using the form data
        this.coordinate = new Coordinate(this.addressForm.controls.locationLongitude.value,this.addressForm.controls.locationLatitude.value);
        // subscribe to the address form changes for the map view
        if(this.mapView){
            this.onAddressFormChanges();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Sets the address value as string when the address form is changed
     * */
    onAddressFormChanges(){
        this.addressForm.valueChanges.takeUntil(this.ngUnsubscribe).pipe(debounceTime(500)).subscribe(value => {
            this.addressString = addressToString(value);
        })
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(50),
            distinctUntilChanged(),
            map(term => CountryUtil.getCountrySuggestions(term))
        );

    public onCoordinateChange(coordinate:Coordinate){
        // update form data
        this.addressForm.controls.locationLatitude.setValue(coordinate.latitude);
        this.addressForm.controls.locationLongitude.setValue(coordinate.longitude);
        this.addressForm.updateValueAndValidity();
        this.addressForm.markAsDirty();
    }

    public static update(addressForm: FormGroup, address: Address): FormGroup {
        if (address) {
            addressForm.controls.streetName.setValue(address.streetName || "");
            addressForm.controls.buildingNumber.setValue(address.buildingNumber || "");
            addressForm.controls.cityName.setValue(address.cityName || "");
            addressForm.controls.region.setValue(address.region || "");
            addressForm.controls.postalCode.setValue(address.postalCode || "");
            addressForm.controls.country.setValue(address.country || "");
            addressForm.controls.locationLatitude.setValue(address.locationLatitude || null);
            addressForm.controls.locationLongitude.setValue(address.locationLongitude || null);
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
            country: ['', [CountryUtil.validateCountryISOCode]],
            locationLatitude: [null],
            locationLongitude: [null]
        });
    }

    onCountryChanged(event) {
        // update the country form control
        this.addressForm.controls.country.setValue(event);
        this.addressForm.markAsDirty();
    }

}
