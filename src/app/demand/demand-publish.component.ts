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

import {Component, OnInit} from '@angular/core';
import {Text} from '../../app/catalogue/model/publish/text';
import {TranslateService} from '@ngx-translate/core';
import {Demand} from '../catalogue/model/publish/demand';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {DEFAULT_LANGUAGE, LANGUAGES} from '../catalogue/model/constants';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {getCountryByISO, getCountrySuggestionsWithMetadata, selectPreferredName} from '../common/utils';
import {Category} from '../catalogue/model/category/category';
import {Code} from '../catalogue/model/publish/code';
import {UserService} from '../user-mgmt/user.service';
import {CookieService} from 'ng2-cookies';
import {BinaryObject} from '../catalogue/model/publish/binary-object';
import {Router} from '@angular/router';
import {NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {CategoryService} from '../catalogue/category/category.service';
import {DemandPublishService} from './demand-publish-service';
import {countryValidator, ValidationService} from '../common/validation/validators';
import {ChildFormBase} from '../common/validation/child-form-base';
import {DemandService} from './demand-service';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {CallStatus} from '../common/call-status';

@Component({
    selector: 'demand-publish',
    templateUrl: './demand-publish.component.html',
    styleUrls: ['./demand-publish.component.css']
})
export class DemandPublishComponent extends ChildFormBase implements OnInit {
    // demand object being updated
    demand: Demand = new Demand();
    selectedCategory: Category;
    additionalFiles: BinaryObject[] = [];

    countryFormControl: FormControl;
    categoryFormControl: FormControl;

    callStatus: CallStatus = new CallStatus();

    selectPreferredName = selectPreferredName;
    LANGUAGES = LANGUAGES;

    constructor(
        private demandPublishService: DemandPublishService,
        private demandService: DemandService,
        private categoryService: CategoryService,
        private validationService: ValidationService,
        private userService: UserService,
        private cookieService: CookieService,
        private translate: TranslateService,
        private router: Router
    ) {
        super();
    }

    ngOnInit() {
        this.formGroup = new FormGroup({});
        this.initViewFormAndAddToParentForm();
        // if there is already a demand being edited, set it to the current demand
        if (this.demandPublishService.modifiedDemand) {
            this.demand = this.demandPublishService.modifiedDemand;
            this.selectedCategory = this.categoryService.selectedCategories[0];
            this.demand.itemClassificationCode[0] = UBLModelUtils.createCodeFromCategory(this.categoryService.selectedCategories[0]);

            if (this.demand.deliveryCountry.value) {
                this.countryFormControl.setValue(getCountryByISO(this.demand.deliveryCountry.value));
            }
            if (this.demand.additionalDocumentReference) {
                this.additionalFiles = [this.demand.additionalDocumentReference.attachment.embeddedDocumentBinaryObject];
            }

            // clear the data in the services to prevent incorrect states considering the availability of the data in the service
            this.demandPublishService.modifiedDemand = null;
            this.categoryService.selectedCategories = [];

            // create a new demand
        } else {
            this.demand.title = [new Text('', DEFAULT_LANGUAGE())];
            this.demand.description = [new Text('', DEFAULT_LANGUAGE())];
            this.demand.itemClassificationCode = [new Code()];
            this.demand.deliveryCountry = new Code();
            this.demand.buyerCountry = new Code();
            this.userService.getSettingsForParty(this.cookieService.get('company_id')).then(res => {
                // FIXME fix this when the country names are changed to codes
                this.demand.buyerCountry.value = res.negotiationSettings.company.postalAddress.country.name.value;
            });
        }
    }

    onAddTitle(): void {
        this.demand.title.push(new Text('', this.getAvailableLanguages(this.demand.title)[0]));
    }

    onDeleteTitle(index: number): void {
        this.demand.title.splice(index, 1);
    }

    onAddDescription(): void {
        this.demand.description.push(new Text('', this.getAvailableLanguages(this.demand.description)[0]));
    }

    onDeleteDescription(index: number): void {
        this.demand.description.splice(index, 1);
    }

    onFileSelected(binaryObject: BinaryObject): void {
        this.demand.additionalDocumentReference = UBLModelUtils.createDocumentReferenceWithBinaryObject(binaryObject);
    }

    onFileDeleted(): void {
        this.demand.additionalDocumentReference = null;
    }

    onPublishDemand(): void {
        this.callStatus.submit();
        this.demandService.publishDemand(this.demand).then(resp => {
            this.callStatus.callback(null, true);
            alert(this.translate.instant('Successfully published. You are now getting redirected.'));
            this.router.navigate(['dashboard'], {
                queryParams: {
                    tab: 'DEMANDS',
                }
            });
        }).catch(e => {
            this.callStatus.error(this.translate.instant('Failed to publish demand'), e);
        });
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(50),
            distinctUntilChanged(),
            map(term => getCountrySuggestionsWithMetadata(term))
        );

    countrySuggestionFormatter = function (suggestion: any): string {
        if (suggestion.text) {
            return suggestion.text;
        } else {
            return suggestion;
        }
    };

    /**
     * Method to find the language ids which are not used for the product names/descriptions
     * */
    getAvailableLanguages(values: Text[]): string[] {
        let languageIds = [];
        if (values) {
            languageIds = values.map(name => name.languageID);
        }
        return this.LANGUAGES.filter(languageId => languageIds.indexOf(languageId) === -1);
    }

    onSelectCategory(): void {
        this.demandPublishService.modifiedDemand = this.demand;
        if (this.selectedCategory) {
            this.categoryService.selectedCategories = [this.selectedCategory];
        }
        this.router.navigate(['catalogue/categorysearch'], {queryParams: {pageRef: 'demand-publish', categoryCount: 'single'}});
    }

    onCountrySelected(event: NgbTypeaheadSelectItemEvent): void {
        event.preventDefault();
        this.countryFormControl.setValue(event.item.text);
        this.demand.deliveryCountry.value = event.item.iso;
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        return this.validationService.getValidationErrorMessage(formControl);
    }

    getValidationError(): string {
        let errorMessage = this.validationService.extractErrorMessage(this.formGroup);
        return errorMessage;
    }

    initializeForm(): void {
        this.initCountryFormControl();
    }

    private initCountryFormControl(): void {
        this.countryFormControl = new FormControl('', [countryValidator()]);
        this.addToCurrentForm('delivery_country', this.countryFormControl);
        this.categoryFormControl = new FormControl('', [Validators.required]);
        this.addToCurrentForm('category', this.categoryFormControl);
    }

}
