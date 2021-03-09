/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import {Component, Input, OnInit} from '@angular/core';
import {CompanySettings} from '../model/company-settings';
import {CallStatus} from '../../common/call-status';
import {UserService} from '../user.service';
import {CookieService} from 'ng2-cookies';
import {TranslateService} from '@ngx-translate/core';
import {AppComponent} from '../../app.component';
import {CategoryService} from '../../catalogue/category/category.service';
import {Category} from '../../common/model/category/category';
import {copy, selectNameFromLabelObject, selectPreferredName} from '../../common/utils';
import {Code} from '../../catalogue/model/publish/code';
import {Router} from '@angular/router';
import * as myGlobals from '../../globals';
import {CompanySubscriptionService} from '../company-subscription.service';
import {SimpleSearchService} from '../../simple-search/simple-search.service';


@Component({
    selector: 'company-subscriptions',
    templateUrl: './company-subscriptions.component.html'
})
export class CompanySubscriptionsComponent implements OnInit {

    @Input() settings: CompanySettings;
    // view mode
    viewMode: 'SUBSCRIPTIONS' | 'CATEGORY_SELECTION' = 'SUBSCRIPTIONS';
    // list of subscribed categories
    subscribedCategories: Category[] = [];
    // list of subscribed companies
    subscribedCompanies: any[] = [];
    // call status
    initCallStatus: CallStatus = new CallStatus();
    saveSubscriptionsCallStatus: CallStatus = new CallStatus();

    // methods to find proper label for categories and business keywords
    selectPreferredName = selectPreferredName;
    getMultilingualLabel = selectNameFromLabelObject;

    // configs
    config = myGlobals.config;
    companyInformationInSearchResult = myGlobals.config.companyInformationInSearchResult;
    product_vendor_name = myGlobals.product_vendor_name;

    constructor(private translate: TranslateService,
                private cookieService: CookieService,
                private appComponent: AppComponent,
                private searchService: SimpleSearchService,
                private router: Router,
                public companySubscriptionService: CompanySubscriptionService,
                public categoryService: CategoryService,
                private userService: UserService) {

    }

    ngOnInit() {
        // check whether the company has any subscribed company and categories
        let hasSubscribedCategories = this.settings.subscribedProductCategories && this.settings.subscribedProductCategories.length;
        let hasCompanySubscriptions = (this.settings.subscribedCompanyIds && this.settings.subscribedCompanyIds.length) || this.companySubscriptionService.selectedCompanies;
        if (hasSubscribedCategories || hasCompanySubscriptions) {
            // retrieve the details of subscribed categories
            if(hasSubscribedCategories){
                this.initCallStatus.aggregatedSubmit();
                this.categoryService.getCategoriesByIds(this.settings.subscribedProductCategories).then(categories => {
                    this.subscribedCategories = categories;
                    this.initCallStatus.aggregatedCallBack('Initialized subscription page successfully', true)
                }).catch(error => {
                    this.initCallStatus.aggregatedError('Failed to initialize subscription page', error)
                })
            }
            // retrieve the subscribed companies from companySubscriptionService
            if(this.companySubscriptionService.selectedCompanies){
                this.subscribedCompanies = this.companySubscriptionService.selectedCompanies;
                // reset the service
                this.companySubscriptionService.reset();
                this.initCallStatus.aggregatedSubmit();
                this.initCallStatus.aggregatedCallBack("Initialized subscription page successfully",true);
            }
            // retrieve the details of subscribed companies
            else if(this.settings.subscribedCompanyIds && this.settings.subscribedCompanyIds.length){
                let fq = this.settings.subscribedCompanyIds.map(companyId => "id:"+companyId);
                this.initCallStatus.aggregatedSubmit();
                this.searchService.getComp("*", [], fq, 1, this.settings.subscribedCompanyIds.length, "lowercaseLegalName asc",'Name' ).then(response => {
                    this.subscribedCompanies = response.result;
                    this.initCallStatus.aggregatedCallBack('Initialized subscription page successfully', true)
                }).catch(error => {
                    this.initCallStatus.aggregatedError('Failed to initialize subscription page', error)
                })
            }
        } else{
            this.initCallStatus.submit();
            this.initCallStatus.callback("Initialized subscription page successfully",true);
        }
    }

    // methods to handle company and category subscriptions
    removeCategory(i: number) {
        this.subscribedCategories.splice(i,1);
    }

    removeParty(i: number) {
        this.subscribedCompanies.splice(i,1);
    }

    searchForCategories() {
        this.categoryService.selectedCategories = copy(this.subscribedCategories);
        this.viewMode = 'CATEGORY_SELECTION';
    }

    onCategoriesSelected() {
        this.viewMode = 'SUBSCRIPTIONS';
        this.subscribedCategories = copy(this.categoryService.selectedCategories);
    }

    onNavigateToCompanySearch() {
        // set selected companies
        this.companySubscriptionService.selectedCompanies = this.subscribedCompanies;
        this.router.navigate(['/simple-search'], { queryParams: { sTop: 'comp', pageRef: 'subscription' } });
    }
    // the end of methods to handle company and category subscriptions

    /**
     * Saves the company and category subscriptions
     * */
    save() {
        this.saveSubscriptionsCallStatus.submit();
        // retrieve category uris
        let categoryUris = this.subscribedCategories.map(category => new Code(category.categoryUri,"","",category.taxonomyId,""));
        // retrieve company ids
        let companyIds = this.subscribedCompanies.map(company => company.id);
        // save the subscriptions
        this.userService.saveSubscriptions(this.cookieService.get('user_id'), categoryUris,companyIds).then(settings => {
            this.settings.subscribedProductCategories = settings.subscribedProductCategories;
            this.settings.subscribedCompanyIds = settings.subscribedCompanyIds
            this.saveSubscriptionsCallStatus.callback('Saved subscriptions successfully');
        }).catch(error => {
            this.saveSubscriptionsCallStatus.error('Failed to save subscriptions', error);
        });
    }
}
