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

import {Component} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import * as myGlobals from '../globals';
import {Router} from '@angular/router';
import {Category} from '../catalogue/model/category/category';
import {createText, selectPreferredName} from '../common/utils';
import {CategoryBoxUiModel} from './model/category-box-ui.model';
import {SimpleSearchService} from '../simple-search/simple-search.service';
import {LANGUAGES} from '../catalogue/model/constants';
import {TranslateService} from '@ngx-translate/core';
import {CategoryService} from '../catalogue/category/category.service';

@Component({
    selector: 'homepage',
    providers: [CookieService],
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.css']
})

export class HomepageComponent {

    categories: CategoryBoxUiModel[];

    manufacturerCount: number;
    supplierCount: number;
    serviceProviderCount: number;
    logisticServiceProviderCount: number;

    catalogueCount: number;
    productCount: number;
    serviceCount: number;

    activitySectors: any[];
    displayedActivitySectorCount = 25;

    getTranslatedCategoryLabel = selectPreferredName;
    public config = myGlobals.config;

    constructor(private searchService: SimpleSearchService,
                private categoryService: CategoryService,
                private translateService: TranslateService,
                private router: Router) {}

    ngOnInit(): void {
        this.getCompanyCounts();
        this.getCatalogueCount();
    }

    /**
     * Template handlers
     */

    onPublishProductClicked(): void {
        this.router.navigate(['catalogue/publish'], { queryParams: { pg: 'single' } });
    }

    onCategoryClicked(category: Category): void {
        category = new Category(
            'http://www.nimble-project.org/resource/eclass#0173-1#01-AAC168#005',
            [createText('Automotive technology')],
            null, null, null, null, null, null, null, null, null);

        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                p: 1,
                cat: selectPreferredName(category),
                catID: category.id,
                sIdx: this.config.defaultSearchIndex,
                sTop: 'prod'
            }
        });
    }

    onSearchClicked(): void {
        this.router.navigate(['/simple-search']);
    }

    onDashboardClicked(): void {
        this.router.navigate(['/dashboard']);
    }

    onMemberCountClicked(businessType: string): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                fq: 'businessType:\"' + businessType + '\"',
                p: 1,
                sIdx: this.config.defaultSearchIndex,
                sTop: 'comp'
            }
        });
    }

    onActivitySectorClicked(sector: string): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                fq: this.translateService.currentLang + '_activitySectors:\"' + sector + '\"',
                p: 1,
                sIdx: this.config.defaultSearchIndex,
                sTop: 'comp'
            }
        });
    }

    onShowMoreActivitySectors(): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                sTop: 'comp'
            }
        });
    }

    scroll(el: HTMLElement) {
        el.scrollIntoView({behavior: 'smooth'});
    }

    /**
     * internal methods
     */

    private getCompanyCounts(): void {
        // get manufacturer counts
        let facetQueries = ['businessType:\"Manufacturer\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'legalName asc', 'Name').then(res => {
            this.manufacturerCount = res.totalElements;
        });
        // get supplier counts
        facetQueries = ['businessType:\"Supplier\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'legalName asc', 'Name').then(res => {
            this.supplierCount = res.totalElements;
        });
        // get logistics service provider counts
        facetQueries = ['businessType:\"Logistics Provider\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'legalName asc', 'Name').then(res => {
            this.logisticServiceProviderCount = res.totalElements;
        });
        // get service provider counts
        facetQueries = ['businessType:\"Service Provider\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'legalName asc', 'Name').then(res => {
            this.serviceProviderCount = res.totalElements;
        });
        // get activity sectors
        const activitySectorFields: string[] = LANGUAGES.map(lang => lang + '_activitySectors');
        this.searchService.getComp('*',
            [...activitySectorFields],
            [],
            1,
            0,
            'legalName asc',
            'Name').then(res => {
            // extract activity sectors for the current language
            const facet = this.translateService.currentLang + '_activitySectors';
            this.activitySectors = res.facets[facet].entry;
        });
    }

    private getCatalogueCount(): void {
        // first get the categories to get the number of services
        this.categoryService.getServiceCategoriesForAvailableTaxonomies().then(res => {

            // catalogue count
            const catalogPromise: Promise<any> = this.searchService.get(
                '*',
                ['catalogueId'],
                [],
                1,
                0,
                'score desc',
                '',
                '',
                'Prod');

            const facetQuery: string[] = [];
            for (let cat of res) {
                facetQuery.push(`-commodityClassficationUri:\"${cat}\"`);
            }
            const servicePromise: Promise<any> = this.searchService.get(
                '*',
                [],
                facetQuery,
                1,
                0,
                'score desc',
                '',
                '',
                'Prod');

            Promise.all([catalogPromise, servicePromise]).then(([catalogResult, notServiceResult]) => {
                this.catalogueCount = catalogResult.facets.catalogueId.entry.length;
                const totalItemCount: number = catalogResult.totalElements;
                this.productCount = notServiceResult.totalElements;
                this.serviceCount = totalItemCount - this.productCount;
            });
        });


    }
}
