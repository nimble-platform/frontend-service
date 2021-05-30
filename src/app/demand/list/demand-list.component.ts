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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { Location } from '@angular/common';
import {TranslateService} from '@ngx-translate/core';
import {CookieService} from 'ng2-cookies';
import {ActivatedRoute, Router} from '@angular/router';
import {DemandService} from '../demand-service';
import {CategoryService} from '../../catalogue/category/category.service';
import {Subscription} from 'rxjs';
import {CallStatus} from '../../common/call-status';
import {Facet} from '../../common/model/facet';
import {FacetValue} from '../../common/model/facet-value';
import {DEFAULT_LANGUAGE} from '../../catalogue/model/constants';
import {SimpleSearchService} from '../../simple-search/simple-search.service';
import {CountryUtil} from '../../common/country-util';
import {AppComponent} from '../../app.component';

@Component({
    selector: 'demand-list',
    templateUrl: './demand-list.component.html',
    styleUrls: ['./demand-list.component.css']
})
export class DemandListComponent implements OnInit, OnDestroy {
    @Input() companyDemands = false;
    @Input() showTitle:boolean = true;

    /*
    data object to be presented contains the original demand entity and also the associated leaf category details to be presented in the form of
    [
     {
       demand: ...,
       leafCategory: ...
     }]
    */
    demands: any[] = [];
    companyData: Map<string, any> = new Map<string, any>();
    demandCategories: FacetValue[];
    buyerCountryFacet: Facet = null;
    deliveryCountryFacet: Facet = null;
    circularEconomyCertificatesFacet: Facet = null;
    otherCertificatesFacet: Facet = null;

    /*
     query parameters
     */
    searchTerm = '';
    selectedCategory: string;
    deliveryCountry: string;
    circularEconomyCertificates: string;
    otherCertificates: string;
    buyerCountry: string;
    page = 0;
    pageSize = 10;
    totalCount: number;
    pageCount: number;

    searchCallStatus: CallStatus = new CallStatus();

    queryParamSubscription: Subscription;

    constructor(
        private demandService: DemandService,
        private categoryService: CategoryService,
        private searchService: SimpleSearchService,
        private cookieService: CookieService,
        private translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        private appComponent:AppComponent,
        private location: Location,
    ) { }

    ngOnInit() {
        this.queryParamSubscription = this.route.queryParams.subscribe(params => {
            if (params['page']) {
                this.page = Math.max(Number.parseInt(params['page']), 1);
            } else {
                this.page = 1;
            }
            this.location.replaceState(
                this.router.createUrlTree(
                    [], {
                        relativeTo: this.route,
                        queryParams: {page: this.page},
                        queryParamsHandling: 'merge', // preserve the existing query params in the route
                    }
                ).toString()
            );

            if (params['query']) {
                this.searchTerm = params['query'];
            }

            if (params['category']) {
                this.selectedCategory = params['category'];
            }

            if (params['buyerCountry']) {
                this.buyerCountry = params['buyerCountry'];
            }

            if (params['deliveryCountry']) {
                this.deliveryCountry = params['deliveryCountry'];
            }

            if (params['circularEconomyCertificates']) {
                this.circularEconomyCertificates = params['circularEconomyCertificates'];
            }

            if (params['otherCertificates']) {
                this.otherCertificates = params['otherCertificates'];
            }

            this.getDemands();
        });

        // clear the new demand count for the demand search
        if(!this.companyDemands && this.demandService.demandLastSeenResponse){
            this.demandService.demandLastSeenResponse.newDemandCount = 0;
        }
    }

    ngOnDestroy(): void {
        this.queryParamSubscription.unsubscribe();
        // get demand last seen response for the user
        this.demandService.getDemandLastSeenResponse();
    }

    onPageChange(pageNo: number): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                tab: 'DEMANDS',
                page: pageNo
            },
            queryParamsHandling: 'merge'
        });
    }

    onSearchClicked(): void {
        let queryParams: any = {page: 1, tab: 'DEMANDS'};
        if (this.searchTerm) {
            queryParams.query = this.searchTerm;
        }
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: queryParams
            });
    }

    onCategorySelected(categoryUri: string): void {
        let queryParams: any = {page: 1, tab: 'DEMANDS', category: categoryUri};
        if (this.searchTerm) {
            queryParams.query = this.searchTerm;
        }
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: queryParams,
                queryParamsHandling: 'merge'
            });
    }

    onFacetSelected(facetSelection: any): void {
        let queryParams: any = {page: 1, tab: 'DEMANDS'}
        if (facetSelection.facet === 'Delivery Country') {
            queryParams.deliveryCountry = CountryUtil.getISObyCountry(facetSelection.selectedValue);
        } else if (facetSelection.facet === 'Buyer Country') {
            queryParams.buyerCountry = CountryUtil.getISObyCountry(facetSelection.selectedValue);
        } else if(facetSelection.facet === 'Sustainability / Environment Certificates'){
            queryParams.circularEconomyCertificates = facetSelection.selectedValue
        } else if(facetSelection.facet === 'Demand Certificates'){
            queryParams.otherCertificates = facetSelection.selectedValue
        }
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: queryParams,
                queryParamsHandling: 'merge'
            });
    }

    onResetSearch(): void {
        this.buyerCountry = null;
        this.deliveryCountry = null;
        this.selectedCategory = null;
        this.searchTerm = null;

        let queryParams: any = {page: 1, tab: 'DEMANDS'};
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: queryParams
            });
    }

    onDemandDeleted(): void {
        this.getDemands();
    }

    private getDemands(): void {
        this.searchCallStatus.submit();
        this.demands = [];
        this.demandCategories = [];

        const companyId = this.companyDemands ? this.cookieService.get('company_id') : null;
        this.demandService.getDemands(this.searchTerm, companyId, this.selectedCategory, this.buyerCountry, this.deliveryCountry, this.page - 1, this.pageSize,this.circularEconomyCertificates,this.otherCertificates)
            .then(demands => {
                this.totalCount = demands.totalCount;
                if (this.totalCount === 0) {
                    this.searchCallStatus.callback(null, true);
                    return;
                }

                // fetch the labels for the categories included in the demands and update the demans with the fetched labels
                const categoryUris: string[] = [];
                demands.demands.forEach(demand => {
                    demand.itemClassificationCode.filter(cat => categoryUris.indexOf(cat.uri) === -1).forEach(cat => categoryUris.push(cat.uri));
                });

                this.categoryService.getCategories(categoryUris).then(categoriesResp => {
                    const categoriesJson: any[] = categoriesResp.result;
                    for (const demand of demands.demands) {
                        // find the index categories for the current demand
                        const demandCatUris: string[] = demand.itemClassificationCode.map(code => code.uri);
                        const demandCategories: any[] = categoriesJson.filter(cat => demandCatUris.findIndex(uri => uri === cat.uri) !== -1);
                        let leafCategory: any;

                        // if the demand categories' size is 1, then a root category should have been selected for the demand
                        if (demandCategories.length === 1) {
                            leafCategory = demandCategories[0];
                        } else {
                            // find the category at the bottom-most level
                            leafCategory = demandCategories.find(cat => !!cat.allParents && cat.allParents.length === demandCategories.length - 1);
                        }

                        this.demands.push({
                            'demand': demand,
                            'leafCategory': leafCategory
                        });
                    }

                    // add the last seen demand id for the user
                    if(!this.companyDemands && this.demands.length > 0){
                        this.demandService.addLastSeenDemandId(this.demands[0].demand.hjid);
                    }
                    this.getCompanyNameFromIds();
                    this.searchCallStatus.callback(null, true);
                }).catch(e => {
                    this.searchCallStatus.error(this.translate.instant('Failed to get demand categories'), e);
                });
            }).catch(e => {
            this.searchCallStatus.error(this.translate.instant('Failed to get demands'), e);
        });
        this.demandService.getDemandFacets(this.searchTerm, companyId, this.selectedCategory, this.buyerCountry, this.deliveryCountry)
            .then(facets => {
                this.setFacetData(facets);
            });
    }

    /**
     * Constructs facet data to be provided to the facet components
     * @param facets
     */
    private setFacetData(facets: Facet[]): void {
        // category facet
        const categoryResponse: Facet = facets.find(facetResponse => facetResponse.facetName === 'Category');
        if (this.selectedCategory) {
            categoryResponse.facetValues.find(facetValue => facetValue.value === this.selectedCategory).selected = true;
        }
        this.demandCategories = categoryResponse.facetValues;

        // delivery country
        const deliveryCountryFacet = facets.find(facetResponse => facetResponse.facetName === 'Delivery Country');
        if (this.deliveryCountry) {
            deliveryCountryFacet.facetValues.find(facetValue => facetValue.value === this.deliveryCountry).selected = true;
        }
        this.deliveryCountryFacet = deliveryCountryFacet;
        // replace country iso codes with country names
        this.deliveryCountryFacet.facetValues.forEach(value => value.value = CountryUtil.getCountryByISO(value.value));

        // buyer country
        const buyerCountryFacet: Facet = this.buyerCountryFacet = facets.find(facetResponse => facetResponse.facetName === 'Buyer Country');
        if (this.buyerCountry) {
            buyerCountryFacet.facetValues.find(facetValue => facetValue.value === this.buyerCountry).selected = true;
        }
        this.buyerCountryFacet = buyerCountryFacet;
        // replace country iso codes with country names
        this.buyerCountryFacet.facetValues.forEach(value => value.value = CountryUtil.getCountryByISO(value.value));

        // circular economy certificates
        const circularEconomyCertificatesFacet = facets.find(facetResponse => facetResponse.facetName === 'Sustainability / Environment Certificates');
        if (this.circularEconomyCertificates) {
            circularEconomyCertificatesFacet.facetValues.find(facetValue => this.circularEconomyCertificates.includes(facetValue.value)).selected = true;
        }
        this.circularEconomyCertificatesFacet = circularEconomyCertificatesFacet;

        // other certificates
        const otherCertificatesFacet = facets.find(facetResponse => facetResponse.facetName === 'Demand Certificates');
        if (this.otherCertificates) {
            otherCertificatesFacet.facetValues.find(facetValue => this.otherCertificates.includes(facetValue.value)).selected = true;
        }
        this.otherCertificatesFacet = otherCertificatesFacet;
    }

    private getCompanyNameFromIds(): void {
        const companyQuery: string = this.demands.map(demand => 'id:' + demand.demand.metadata.ownerCompany[0]).join(' OR ');
        this.searchService.getCompanies(companyQuery, [], this.demands.length).then(companies => {
            companies.result.forEach(company => {
                this.companyData.set(company.id, company);
            });
        });
    }
}
