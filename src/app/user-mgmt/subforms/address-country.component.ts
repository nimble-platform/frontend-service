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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {CountryUtil} from '../../common/country-util';

@Component({
    selector: 'address-country',
    templateUrl: 'address-country.component.html',
    styleUrls: ['address-country.component.css']
})
export class AddressCountryComponent {

    _countryISOCode: string;
    @Input()
    set countryISOCode(countryISOCode: string) {
        this._countryISOCode = countryISOCode;

        // create form group for country input
        this.countryFormGroup = this._fb.group({
            country: [CountryUtil.getCountryByISO(countryISOCode), CountryUtil.validateCountry]
        })
    }

    get countryISOCode(): string {
        return this._countryISOCode;
    }

    @Input() disabledFlag: boolean = false;
    @Input() requiredFlag: boolean = true;

    @Output() onCountryISOCodeChange: EventEmitter<string> = new EventEmitter<string>();

    countryFormGroup: FormGroup;

    constructor(private _fb: FormBuilder,
    ) {
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(50),
            distinctUntilChanged(),
            map(term => CountryUtil.getCountrySuggestions(term))
        );

    onCountrySelected(event) {
        this.onCountryISOCodeChange.emit(CountryUtil.getISObyCountry(event.target.value))
    }
}
