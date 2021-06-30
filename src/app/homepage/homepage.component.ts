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

import {Component, ElementRef, ViewChild} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import * as myGlobals from '../globals';
import {Router} from '@angular/router';
import {Category} from '../common/model/category/category';
import {createText, selectPreferredName} from '../common/utils';
import {CategoryBoxUiModel} from './model/category-box-ui.model';
import {SimpleSearchService} from '../simple-search/simple-search.service';
import {LANGUAGES} from '../catalogue/model/constants';
import {TranslateService} from '@ngx-translate/core';
import {CategoryService} from '../catalogue/category/category.service';
import {CategoryModelUtils} from '../catalogue/model/model-util/category-model-utils';
import {OwlOptions} from 'ngx-owl-carousel-o';
import {ActivitySectorUiModel} from './model/activity-sector-ui.model';
import {Location} from '@angular/common';

@Component({
    selector: 'homepage',
    providers: [CookieService],
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.css']
})

export class HomepageComponent {

    categoriesData: CategoryBoxUiModel[];
    activitySectorsData: ActivitySectorUiModel[];

    manufacturerCount: number;
    supplierCount: number;
    serviceProviderCount: number;
    logisticServiceProviderCount: number;

    catalogueCount: number;
    productCount: number;
    serviceCount: number;

    activitySectors: any[];
    displayedActivitySectorCount = 25;

    @ViewChild('beginning') beginningElement: ElementRef;

    getTranslatedCategoryLabel = selectPreferredName;
    public config = myGlobals.config;

    images = [
        'assets/homepage/furniture.jpeg',
        'assets/homepage/substance.jpeg',
        'assets/homepage/material.jpeg',
        'assets/homepage/component.jpeg'
    ];

    categoryBoxConfiguration: any[] = [
        {
            'mainCategory': 'http://www.aidimme.es/FurnitureSectorOntology.owl#Furniture',
            'subCategories': [
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Chair',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Table',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#FurnitureComposition',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#FurnitureComplement'
            ],
            'img': 'assets/homepage/furniture.jpeg',
            'title': 'Furniture'
        },
        {
            'mainCategory': 'http://www.aidimme.es/FurnitureSectorOntology.owl#Substance',
            'subCategories': [
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Varnish',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Dye',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Adhesive',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Solvent'
            ],
            'img': 'assets/homepage/substance.jpeg',
            'title': 'Substance'
        },
        {
            'mainCategory': 'http://www.aidimme.es/FurnitureSectorOntology.owl#Material',
            'subCategories': [
                'http://www.aidimme.es/FurnitureSectorOntology.owl#WoodenMaterial',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#EdgeBand',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#WoodenBoard',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#PlasticMaterial'
            ],
            'img': 'assets/homepage/material.jpeg',
            'title': 'Material'
        },
        {
            'mainCategory': 'http://www.aidimme.es/FurnitureSectorOntology.owl#Service',
            'subCategories': [
                'http://www.aidimme.es/FurnitureSectorOntology.owl#ConsultingService',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#CertificationService',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#EngineeringService',
                'http://www.aidimme.es/FurnitureSectorOntology.owl#Training'
            ],
            'img': 'assets/homepage/services.jpg',
            'title': 'Service'
        }
    ];

    activitySectorImages: any = {
        'Bathroom': 'assets/homepage/sectors/bathroom.jpg',
        'Carpentry': 'assets/homepage/sectors/carpentry.jpg',
        'Childcare': 'assets/homepage/sectors/childcare.jpeg',
        'Closet / Cupboard': 'assets/homepage/sectors/closet-cupboard.jpg',
        'Consulting': 'assets/homepage/sectors/consulting.jpeg',
        'Manufacturer-Contract': 'assets/homepage/sectors/contract.jpeg',
        'Design / Decoration': 'assets/homepage/sectors/design-decoration.jpeg',
        'Doors / Windows': 'assets/homepage/sectors/doors-windows.jpeg',
        'Fitting': 'assets/homepage/sectors/fitting.jpg',
        'Home': 'assets/homepage/sectors/home.jpg',
        'Hotels, Restaurants & Cafes': 'assets/homepage/sectors/hotels-restaurants-cafes.jpeg',
        'Kids': 'assets/homepage/sectors/kids.jpeg',
        'Kitchen': 'assets/homepage/sectors/kitchen.jpg',
        'Lightings / Lamps': 'assets/homepage/sectors/lightings-lamps.jpeg',
        'Office': 'assets/homepage/sectors/office.jpg',
        'Outdoor Furniture': 'assets/homepage/sectors/outdoor-furniture.jpg',
        'Paints & Varnishes': 'assets/homepage/sectors/paints-and-varnishes.jpg',
        'Panels': 'assets/homepage/sectors/panels.jpg',
        'Parquet Floors': 'assets/homepage/sectors/parquet-floors.jpeg',
        'Sales Agent': 'assets/homepage/sectors/sales-agent.jpeg',
        'Training': 'assets/homepage/sectors/training.jpeg',
        'Upholstered Furniture': 'assets/homepage/sectors/upholstered-furniture.jpg',
        'Veneer': 'assets/homepage/sectors/veneer.jpg',
        'Wood': 'assets/homepage/sectors/wood.jpeg',
    };

    activitySectorCarouselConfiguration: OwlOptions = {
        loop: true,
        mouseDrag: true,
        touchDrag: false,
        pullDrag: false,
        dots: false,
        navSpeed: 700,
        navText: [ '<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>' ],
        margin: 20,
        autoWidth: true,
        responsive: {
            0: {
                items: 1
            },
            400: {
                items: 2
            },
            740: {
                items: 3
            },
            940: {
                items: 5
            }
        },
        nav: true
    };

    constructor(private searchService: SimpleSearchService,
                private categoryService: CategoryService,
                private translateService: TranslateService,
                private router: Router) {}

    ngOnInit(): void {
        // document.querySelector('#beginning').scrollIntoView({block: 'start'});
        this.scroll(this.beginningElement.nativeElement, null);
        this.getCategories();
        this.getCompanyCounts();
        this.getCatalogueCount();
    }

    /**
     * Template handlers
     */

    onDiscoverProductsClicked(): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                p: 1,
                cat: '',
                catID: '',
                sIdx: this.config.defaultSearchIndex,
                sTop: 'prod'
            }
        });
    }

    onPublishDemandClicked(): void {
        this.router.navigate(['/demand/publish']);
    }

    onSearchDemandClicked(): void {
        this.router.navigate(['/demand'], {
            queryParams: {
                page: 1,
            }
        });
    }

    onPublishProductClicked(): void {
        this.router.navigate(['catalogue/publish-single'], { queryParams: { pageRef: 'homepage'} });
    }

    onCategoryClicked(category: Category): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                p: 1,
                cat: selectPreferredName(category),
                catID: category.categoryUri,
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

    scroll(el: HTMLElement, behavior: ScrollBehavior = 'smooth') {
        if (behavior) {
            el.scrollIntoView({block: 'nearest', behavior: behavior});
        } else {
            el.scrollIntoView(false);
        }
    }

    /**
     * internal methods
     */

    private getCompanyCounts(): void {
        // get manufacturer counts
        let facetQueries = ['businessType:\"Manufacturer\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'lowercaseLegalName asc', 'Name').then(res => {
            this.manufacturerCount = res.totalElements;
        });
        // get supplier counts
        facetQueries = ['businessType:\"Supplier\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'lowercaseLegalName asc', 'Name').then(res => {
            this.supplierCount = res.totalElements;
        });
        // get logistics service provider counts
        facetQueries = ['businessType:\"Logistics Provider\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'lowercaseLegalName asc', 'Name').then(res => {
            this.logisticServiceProviderCount = res.totalElements;
        });
        // get service provider counts
        facetQueries = ['businessType:\"Service Provider\"'];
        this.searchService.getComp('*', [], facetQueries, 1, 0, 'lowercaseLegalName asc', 'Name').then(res => {
            this.serviceProviderCount = res.totalElements;
        });
        // get activity sectors
        const activitySectorFields: string[] = LANGUAGES.map(lang => lang + '_activitySectors');
        this.searchService.getComp('*',
            [...activitySectorFields],
            [],
            1,
            0,
            'lowercaseLegalName asc',
            'Name').then(res => {
            // extract activity sectors for the current language
            const facet = this.translateService.currentLang + '_activitySectors';
            this.activitySectors = res.facets[facet].entry;
            this.constructActivitySectorData();
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

    private getCategories(): void {
        let allCategories: string[] = [];
        this.categoryBoxConfiguration.forEach (currentConf => {
            allCategories.push(...currentConf.subCategories);
            allCategories.push(currentConf.mainCategory);
        });

        this.categoryService.getCategories(allCategories).then((categories: any) => {
            // put all the categories to a map for easy reference
            const categoryMap: Map<string, Category> = new Map<string, Category>();
            for (let category of categories.result) {
                categoryMap.set(category.uri, CategoryModelUtils.transformIndexCategoryToDbCategory(category));
            }

            this.categoriesData = [];
            this.categoryBoxConfiguration.forEach (currentConf => {
                const categoryData: CategoryBoxUiModel = this.constructCategoryBoxData(
                    currentConf.img,
                    currentConf.title,
                    currentConf.mainCategory,
                    currentConf.subCategories,
                    categoryMap
                );
                this.categoriesData.push(categoryData);
            });
        });
    }

    /**
     * Constructs data to be displayed inside a single category box on the template
     * @param img
     * @param title
     * @param rootCategoryUri
     * @param subCategoryUris
     * @param categoryMap
     */
    private constructCategoryBoxData(img: string,
                                     title: string,
                                     rootCategoryUri: string,
                                     subCategoryUris: string[],
                                     categoryMap: Map<string, Category>): CategoryBoxUiModel {
        return new CategoryBoxUiModel({
            img: img,
            title: this.translateService.instant(title),
            categories: this.getSubcategoriesFromMap(categoryMap, subCategoryUris),
            rootCategory: categoryMap.get(rootCategoryUri)
        });
    }

    /**
     * Just extracts the Categories, specified by the uri list, from the map
     * @param categoryMap
     * @param categoryUris
     */
    private getSubcategoriesFromMap(categoryMap: Map<string, Category>, categoryUris: string[]): Category[] {
        const categories: Category[] = [];
        for (const uri of categoryUris) {
            categories.push(categoryMap.get(uri));
        }
        return categories;
    }

    private constructActivitySectorData(): void {
        const sectors: ActivitySectorUiModel[] = this.activitySectors
            .filter(sector => sector.count >=  5)
            .map(sector => {
            return new ActivitySectorUiModel({
                'img': !!this.activitySectorImages[sector.label] ? this.activitySectorImages[sector.label] : 'assets/placeholder.jpg',
                'label': sector.label,
                'count': sector.count
            });
        });
        this.activitySectorsData = sectors;
    }
}
