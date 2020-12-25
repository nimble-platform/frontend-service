/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import {TranslateService} from '@ngx-translate/core';
import * as COUNTRY_CODES from '../../assets/countries/country_code_list.json';
import {AbstractControl, ValidatorFn} from '@angular/forms';
import {Subject} from 'rxjs';
import {OnDestroy} from '@angular/core';
import 'rxjs/add/operator/takeUntil';

export class CountryUtil implements OnDestroy {

    static COUNTRY_CODES = null; // iso code of countries
    static COUNTRY_NAMES = null; // country names (translated and sorted)
    static COUNTRY_JSON = null; // country name-iso pairs

    static ngUnsubscribe: Subject<void> = new Subject<void>();

    ngOnDestroy() {
        CountryUtil.ngUnsubscribe.next();
        CountryUtil.ngUnsubscribe.complete();
    }

    static initialize(translateService: TranslateService) {
        translateService.get(COUNTRY_CODES).takeUntil(CountryUtil.ngUnsubscribe).subscribe(translations => {
            const countryJson = [];
            const countryList = [];
            for (let country of COUNTRY_CODES) {
                const name = translations[country];
                countryList.push(name);
                countryJson.push({'name': name, 'iso': country});
            }
            countryList.sort();

            CountryUtil.COUNTRY_NAMES = countryList;
            CountryUtil.COUNTRY_JSON = countryJson;
            CountryUtil.COUNTRY_CODES = COUNTRY_CODES;
        })
    }

    static countryValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: boolean } | null => {
            let value: string = control.value;
            if (CountryUtil.COUNTRY_NAMES.indexOf(value) === -1) {
                return {'invalid_country': true};
            }
            return null;
        };
    }

    static validateCountrySimple(countryName: string): boolean {
        return CountryUtil.COUNTRY_NAMES.indexOf(countryName) != -1;
    }

    static validateCountry(control: AbstractControl): any {
        const match = (CountryUtil.COUNTRY_NAMES.indexOf(control.value) != -1);
        if (!match) {
            return {invalid_country: true};
        }
        return null;
    }

    static getCountryByISO(term: string): string {
        let countries = this.COUNTRY_JSON.filter(country => country.iso == term);
        if (countries.length > 0) {
            return countries[0].name;
        }
        return '';
    }

    static getISObyCountry(term: string): string {
        let countries = this.COUNTRY_JSON.filter(country => country.name == term);
        if (countries.length > 0) {
            return countries[0].iso;
        }
        return '';
    }

    static getCountrySuggestions(term: string): string[] {
        const suggestions = CountryUtil.getCountrySuggestionsWithMetadata(term);
        return suggestions.map(suggestion => suggestion.text);
    }

    /**
     * Returns suggestions for the given query term. A suggestion includes country name, iso code and match probability
     * @param term
     */
    static getCountrySuggestionsWithMetadata(term: string): any[] {
        let suggestions = [];
        if (term !== '') {
            for (let i = 0; i < CountryUtil.COUNTRY_JSON.length; i++) {
                let prob = 0;
                if (term.length === 2) {
                    if (CountryUtil.COUNTRY_JSON[i].iso.toLowerCase() === term.toLowerCase()) {
                        prob = 1;
                    }
                }
                if (prob < 1) {
                    if (CountryUtil.COUNTRY_JSON[i].name.toLowerCase() === term.toLowerCase()) {
                        prob = 1;
                    } else if (CountryUtil.COUNTRY_JSON[i].name.toLowerCase().indexOf(term.toLowerCase()) === 0) {
                        prob = 0.9;
                    } else if (CountryUtil.COUNTRY_JSON[i].name.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                        prob = 0.7;
                    }
                }
                if (prob > 0) {
                    suggestions.push({
                        'prob': prob,
                        'text': CountryUtil.COUNTRY_JSON[i].name,
                        'iso': CountryUtil.COUNTRY_JSON[i].iso
                    });
                }
            }
            suggestions = suggestions.sort(function (a, b) {
                let a_comp = a.prob;
                let b_comp = b.prob;
                return b_comp - a_comp;
            });
            suggestions = suggestions.slice(0, Math.min(suggestions.length, 10));
        }
        return suggestions;
    }
}
