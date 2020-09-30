/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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
import {Search} from './model/search';
import {SimpleSearchService} from './simple-search.service';
import {ActivatedRoute, Router} from '@angular/router';
import * as myGlobals from '../globals';
import {SearchContextService} from './search-context.service';
import {Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {copy, roundToTwoDecimals, selectNameFromLabelObject} from '../common/utils';
import {CallStatus} from '../common/call-status';
import {CURRENCIES, DEFAULT_LANGUAGE} from '../catalogue/model/constants';
import {CategoryService} from '../catalogue/category/category.service';
import {Category} from '../catalogue/model/category/category';
import {CatalogueService} from '../catalogue/catalogue.service';
import {PublishService} from '../catalogue/publish-and-aip.service';
import {ShoppingCartDataService} from '../bpe/shopping-cart/shopping-cart-data-service';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {product_base_quantity, product_base_quantity_unit} from '../common/constants';
import {TranslateService} from '@ngx-translate/core';
import {AppComponent} from '../app.component';
import {WhiteBlackListService} from '../catalogue/white-black-list.service';
import {NetworkCompanyListService} from '../user-mgmt/network-company-list.service';
import {RatingUi} from '../catalogue/model/ui/rating-ui';

@Component({
    selector: 'simple-search-form',
    templateUrl: './simple-search-form.component.html',
    styleUrls: ['./simple-search-form.component.css']
})

export class SimpleSearchFormComponent implements OnInit {

    product_vendor = myGlobals.product_vendor;
    product_vendor_id = myGlobals.product_vendor_id;
    product_vendor_name = myGlobals.product_vendor_name;
    product_vendor_brand_name = myGlobals.product_vendor_brand_name;
    product_vendor_rating = myGlobals.product_vendor_rating;
    product_vendor_rating_seller = myGlobals.product_vendor_rating_seller;
    product_vendor_rating_fulfillment = myGlobals.product_vendor_rating_fulfillment;
    product_vendor_rating_delivery = myGlobals.product_vendor_rating_delivery;
    product_vendor_evaluation = myGlobals.product_vendor_evaluation;
    product_vendor_trust = myGlobals.product_vendor_trust;
    product_name = myGlobals.product_name;
    product_description = myGlobals.product_description;
    product_img = myGlobals.product_img;
    product_vendor_img = myGlobals.product_vendor_img;
    product_base_quantity = product_base_quantity;
    product_base_quantity_unit = product_base_quantity_unit;
    product_price = myGlobals.product_price;
    product_currency = myGlobals.product_currency;
    product_filter_prod = myGlobals.product_filter_prod;
    product_filter_comp = myGlobals.product_filter_comp;
    product_filter_trust = myGlobals.product_filter_trust;
    product_filter_mappings = myGlobals.product_filter_mappings;
    product_nonfilter_full = myGlobals.product_nonfilter_full;
    product_nonfilter_regex = myGlobals.product_nonfilter_regex;
    product_nonfilter_data_type = myGlobals.product_nonfilter_data_type;
    product_cat = myGlobals.product_cat;
    product_cat_mix = myGlobals.product_cat_mix;
    party_facet_field_list = myGlobals.party_facet_field_list;
    party_filter_main = myGlobals.party_filter_main;
    party_filter_trust = myGlobals.party_filter_trust;
    roundToTwoDecimals = roundToTwoDecimals;
    item_manufacturer_id = myGlobals.item_manufacturer_id;
    searchIndex = myGlobals.config.defaultSearchIndex;
    productServiceFiltersEnabled = myGlobals.config.productServiceFiltersEnabled;
    collapsiblePropertyFacets = myGlobals.config.collapsiblePropertyFacets;
    displayCategoryCounts = myGlobals.config.displayCategoryCounts;
    companyInformationInSearchResult = myGlobals.config.companyInformationInSearchResult;
    searchIndexes = ['Name', 'Category'];
    searchTopic = null;

    CURRENCIES = CURRENCIES;
    selectedCurrency: any = myGlobals.config.standardCurrency;
    selectedPriceMin: any;
    selectedPriceMax: any;

    // keeps ratings for the Rating & Trust filter
    ratingTrustFilters: RatingUi[] = null;

    showCatSection = true;
    showProductSection = false;
    showCompSection = false;
    showTrustSection = false;
    showOtherSection = false;

    shoppingCartCallStatuses: CallStatus[] = [];
    searchCallStatus: CallStatus = new CallStatus();
    callback = false;
    size = 0;
    page = 1;
    rows = 12;
    start = 0;
    end = 0;
    display = 'list';
    sort = 'score desc';
    cat = '';
    catID = '';
    cat_level = -1;
    cat_levels = [];
    cat_loading = true;
    searchContext = null;
    model = new Search('');
    objToSubmit = new Search('');
    facetObj: any;
    facetQuery: any[];
    temp: any;
    response: any;
    imageMap: any = {}; // keeps the images if exists for the search results
    maxFacets = 5;
    manufacturerIdCountMap: any;

    imgEndpoint = myGlobals.user_mgmt_endpoint + '/company-settings/image/';

    config = myGlobals.config;
    getMultilingualLabel = selectNameFromLabelObject;
    // used to get labels of the ubl properties
    ublProperties = null;

    pageRef = ''; // page where the user is navigated from. empty string ('') means the search is opened directly

    productsSelectedForPublish: any[] = []; // keeps the products in the Solr format

    // selected taxonomy in the category facet
    taxonomy: string = null;
    // available ontologies on the instance
    taxonomyIDs: string[] = null;
    // category counts which are needed to build category tree
    categoryCounts: any[] = null;

    ngUnsubscribe: Subject<void> = new Subject<void>();
    private translations: any;
    // suggestions for the category search
    categorySuggestions: any = [];

    constructor(private simpleSearchService: SimpleSearchService,
                private searchContextService: SearchContextService,
                private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private whiteBlackListService: WhiteBlackListService,
                public networkCompanyListService: NetworkCompanyListService,
                private publishService: PublishService,
                public shoppingCartDataService: ShoppingCartDataService,
                private translateService: TranslateService,
                private appComponent: AppComponent,
                public route: ActivatedRoute,
                private translate: TranslateService,
                public router: Router) {
    }

    ngOnInit(): void {
        this.appComponent.translate.get(['Other']).takeUntil(this.ngUnsubscribe).subscribe((res: any) => {
            this.translations = res;
        });

        this.route.queryParams.subscribe(params => {
            let q = params['q'];
            let fq = params['fq'];
            let p = params['p'];
            let rows = params['rows'];
            let sort = params['sort'];
            let cat = params['cat'];
            let catID = params['catID'];
            let pageRef = params['pageRef'];
            let searchContext = params['searchContext'];
            let sIdx = params['sIdx'];
            if (sIdx) {
                this.searchIndex = sIdx;
            } else {
                this.searchIndex = myGlobals.config.defaultSearchIndex;
            }
            let sTop = params['sTop'];
            if (sTop) {
                this.searchTopic = sTop;
            } else {
                this.searchTopic = null;
            }
            if (this.searchTopic == 'comp') {
                this.searchIndexes = ['Name', 'Business Keywords'];
            } else {
                this.searchIndexes = ['Name', 'Category'];
            }
            if (this.searchIndex && this.searchIndexes.indexOf(this.searchIndex) == -1) {
                this.searchIndex = this.searchIndexes[0];
            }
            let display = params['display'];
            if (display) {
                this.display = display;
            } else {
                this.display = 'list';
            }
            if (fq) {
                fq = decodeURIComponent(fq).split('_SEP_');
            } else {
                fq = [];
            }
            if (rows && !isNaN(rows)) {
                rows = parseInt(rows);
                this.rows = rows;
            } else {
                rows = 12;
            }
            if (p && !isNaN(p)) {
                p = parseInt(p);
                this.size = p * rows;
                this.page = p;
            } else {
                p = 1;
            }
            if (sort) {
                this.sort = sort;
            } else {
                sort = 'score desc';
                this.sort = sort;
            }
            if (cat) {
                this.cat = cat;
            } else {
                this.cat = '';
            }

            // if the standard taxonomy is 'All', then we use 'eClass' as the default taxonomy
            // and populate 'taxonomyIDs' variable with the ones available in the instance
            if (myGlobals.config.standardTaxonomy.localeCompare('All') == 0) {
                this.taxonomy = 'eClass';
                this.taxonomyIDs = Object.keys(myGlobals.config.categoryFilter);
            }
            // otherwise, we use the selected taxonomy as the default one
            else {
                this.taxonomy = myGlobals.config.standardTaxonomy;
            }

            if (catID) {
                this.catID = catID;
                // set the taxonomy according to the selected category
                for (let taxonomy of Object.keys(myGlobals.config.categoryFilter)) {
                    let ontologyPrefix = myGlobals.config.categoryFilter[taxonomy].ontologyPrefix;
                    if (catID.startsWith(ontologyPrefix)) {
                        this.taxonomy = taxonomy;
                        break;
                    }
                }
            } else {
                this.catID = '';
            }
            if (pageRef) {
                this.pageRef = pageRef;
            } else {
                this.pageRef = null;
            }
            this.searchContext = !!searchContext;
            if (q && sTop) {
                if (sTop == 'prod') {
                    this.getCall(q, fq, p, rows, sort, cat, catID, sIdx, sTop);
                } else if (sTop == 'comp') {
                    this.getCompCall(q, fq, p, rows, sort, sTop);
                }
            } else if (sTop) {
                this.callback = false;
                this.searchCallStatus.reset();
                this.model.q = '*';
                this.objToSubmit.q = '*';
                this.facetQuery = fq;
                this.page = p;
                this.rows = rows;
                this.sort = sort;
                this.objToSubmit = copy(this.model);
                this.page = 1;
                this.get(this.objToSubmit);
            } else {
                this.callback = false;
                this.searchCallStatus.reset();
                this.model.q = '*';
                this.objToSubmit.q = '*';
                this.facetQuery = fq;
                this.page = p;
                this.rows = rows;
                this.sort = sort;
            }
        });

        // populate shoppingCartCallStatuses
        for (let i = 0; i < this.rows; i++) {
            this.shoppingCartCallStatuses.push(new CallStatus());
        }
    }

    initializeRatingAndTrustFilters() {
        if (this.ratingTrustFilters === null) {
            this.ratingTrustFilters = [];
            this.ratingTrustFilters.push(new RatingUi(this.product_vendor_rating, this.getName(this.product_vendor_rating, this.product_vendor), 0))
            this.ratingTrustFilters.push(new RatingUi(this.product_vendor_rating_seller, this.getName(this.product_vendor_rating_seller, this.product_vendor), 0))
            this.ratingTrustFilters.push(new RatingUi(this.product_vendor_rating_fulfillment, this.getName(this.product_vendor_rating_fulfillment, this.product_vendor), 0))
            this.ratingTrustFilters.push(new RatingUi(this.product_vendor_rating_delivery, this.getName(this.product_vendor_rating_delivery, this.product_vendor), 0))

            this.ratingTrustFilters.sort(function (a, b) {
                return a.displayName.localeCompare(b.displayName);
            });

            this.ratingTrustFilters.push(new RatingUi(this.product_vendor_trust, this.getName(this.product_vendor_trust, this.product_vendor), 0))
        }
    }

    get(search: Search): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: search.q,
                fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
                p: this.page,
                rows: this.rows,
                display: this.display,
                sort: this.sort,
                searchContext: this.searchContext,
                cat: this.cat,
                catID: this.catID,
                sIdx: this.searchIndex,
                sTop: this.searchTopic,
                pageRef: this.pageRef
            }
        });
    }

    setSearchTopic(sTop: string): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: '*',
                fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
                p: this.page,
                rows: this.rows,
                display: this.display,
                sort: this.sort,
                searchContext: this.searchContext,
                cat: this.cat,
                catID: this.catID,
                sIdx: this.searchIndex,
                sTop: sTop,
                pageRef: this.pageRef
            }
        });
    }

    setRows(rows: any): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: this.objToSubmit.q,
                fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
                p: 1,
                rows: parseInt(rows),
                display: this.display,
                sort: this.sort,
                searchContext: this.searchContext,
                cat: this.cat,
                catID: this.catID,
                sIdx: this.searchIndex,
                sTop: this.searchTopic,
                pageRef: this.pageRef
            }
        });
    }

    setDisplay(display: any): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: this.objToSubmit.q,
                fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
                p: this.page,
                rows: this.rows,
                display: display,
                sort: this.sort,
                searchContext: this.searchContext,
                cat: this.cat,
                catID: this.catID,
                sIdx: this.searchIndex,
                sTop: this.searchTopic,
                pageRef: this.pageRef
            }
        });
    }

    setSort(sort: any): void {
        this.router.navigate(['/simple-search'], {
            queryParams: {
                q: this.objToSubmit.q,
                fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
                p: this.page,
                rows: this.rows,
                display: this.display,
                sort: sort,
                searchContext: this.searchContext,
                cat: this.cat,
                catID: this.catID,
                sIdx: this.searchIndex,
                sTop: this.searchTopic,
                pageRef: this.pageRef
            }
        });
    }

    private changeSearchIndex(indexName) {
        if (this.searchIndex != indexName) {
            this.searchIndex = indexName;
        }
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term =>
                this.simpleSearchService.getSuggestions(term, ('{LANG}_' + this.product_name), this.searchIndex)
            )
        ).pipe(map(suggestions => {
            // for the category search, suggestions include category label and uri
            if (this.searchIndex === 'Category') {
                this.categorySuggestions = suggestions;
                return suggestions.map(suggestion => suggestion['label']);
            }
            return suggestions;
        }));

    getCompSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term =>
                this.simpleSearchService.getCompSuggestions(term, this.searchIndex == 'Business Keywords' ? ['{LANG}_businessKeywords'] : [this.product_vendor_name, ('{LANG}_' + this.product_vendor_brand_name)], this.pageRef)
            )
        );

    private async buildCatTree() {

        // taxonomy prefix corresponds to the base url of the taxonomy that exists before each relevant category
        // e.g. assuming category url: http://www.aidimme.es/FurnitureSectorOntology.owl#MDFBoard
        // taxonomy prefix would be: http://www.aidimme.es/FurnitureSectorOntology.owl#
        let taxonomyPrefix = '';
        if (this.config.categoryFilter[this.taxonomy] && this.config.categoryFilter[this.taxonomy].ontologyPrefix) {
            taxonomyPrefix = this.config.categoryFilter[this.taxonomy].ontologyPrefix;
        }

        // retrieve the labels for the category uris included in the categoryCounts field
        let categoryUris: string[] = [];
        for (let categoryCount of this.categoryCounts) {
            categoryUris.push(categoryCount.label);
        }
        this.cat_loading = true;
        // here, all the information about the categories are fetched from the indexing service
        const indexCategories = await this.categoryService.getCategories(categoryUris);
        // extract only the required information in UI from the complete category information
        let categoryDisplayInfo: any = this.getCategoryDisplayInfo(indexCategories, this.categoryCounts);
        if (taxonomyPrefix != '') {
            // save the selected category
            let originalSelectedCategoryID = this.catID;
            let originalSelectedCategoryName = this.cat;
            // build the category tree until the latest level contains more than one category or
            // the category at the latest level does not have any children categories
            let previouslySelectedCategoryId = '';
            do {
                previouslySelectedCategoryId = this.catID;
                // set the level of the selected category, if any
                this.cat_level = this.getCatLevel(this.catID, indexCategories.result);
                this.cat_levels = [];
                this.constructCategoryTree(indexCategories.result, categoryDisplayInfo, this.taxonomy, taxonomyPrefix);

                this.sortCatLevels();
                this.populateOtherEntries();
                // if the latest level contains only one category, make it the selected category
                // and populate category tree again
                let catLevelSize = this.cat_levels.length;
                if (catLevelSize > 0 && this.cat_levels[catLevelSize - 1].length == 1) {
                    this.catID = this.cat_levels[catLevelSize - 1][0].id;
                    this.cat = this.cat_levels[catLevelSize - 1][0].name;
                }

            } while (this.catID != previouslySelectedCategoryId);
            // set the selected category
            this.catID = originalSelectedCategoryID;
            this.cat = originalSelectedCategoryName;
        } else {
            // set the level of the selected category, if any
            this.cat_level = this.getCatLevel(this.catID, indexCategories.result);
            this.cat_levels = [];
        }
        this.cat_loading = false;
    }

    private constructCategoryTree(indexCategories: any[],
                                  categoryDisplayInfo: any,
                                  taxonomy: string,
                                  taxonomyPrefix: string) {
        if (this.cat_level === -1) {
            // get root categories
            let rootCategories: any[] = [];
            for (let category of indexCategories) {
                if (category.allParents == null && this.isCategoryDisplayable(category.uri, categoryDisplayInfo, taxonomy, taxonomyPrefix)) {
                    rootCategories.push({
                        'name': category.uri,
                        'id': category.uri,
                        'count': categoryDisplayInfo[category.uri].count,
                        'preferredName': selectNameFromLabelObject(categoryDisplayInfo[category.uri].label)
                    });
                }
            }
            this.cat_levels.push(rootCategories);

        } else {
            let selectedIndexCategory: any = indexCategories.find(indexCategory => indexCategory.uri === this.catID);
            for (let indexCategory of indexCategories) {
                // check whether the category belongs to the active taxonomy and not hidden
                if (!this.isCategoryDisplayable(indexCategory.uri, categoryDisplayInfo, taxonomy, taxonomyPrefix)) {
                    continue;
                }

                let parentsAndChildren: string[] =
                    (selectedIndexCategory.allChildren != null ? selectedIndexCategory.allChildren : [])
                        .concat(selectedIndexCategory.allParents != null ? selectedIndexCategory.allParents : []);
                let catLevel = indexCategory.allParents != null ? indexCategory.allParents.length : 0;
                if (indexCategory.uri !== selectedIndexCategory.uri && // include the taxonomy itself no matter what
                    // do not include the category if it is not include in the hierarchy of the selected category
                    // or it is located on a two or more levels deeper in the hierarchy
                    parentsAndChildren.findIndex(uri => uri === indexCategory.uri) === -1 || (catLevel - this.cat_level > 1)) {
                    continue;
                }

                if (this.cat_levels[catLevel] == null) {
                    this.cat_levels[catLevel] = [];
                }

                let categoryUri: string = indexCategory.uri;
                this.cat_levels[catLevel].push({
                    'name': categoryUri,
                    'id': categoryUri,
                    'count': categoryDisplayInfo[categoryUri].count,
                    'preferredName': selectNameFromLabelObject(categoryDisplayInfo[categoryUri].label)
                });
            }
        }
    }

    /**
     * Decides whether a category could be displayed in the category taxonomy filter. Checks:
     * 1) whether the resultant category has appropriate labels
     * 2) whether the category belongs to the active taxonomy
     * 3) is not configured as hidden
     */
    private isCategoryDisplayable(categoryUri: string, categoryDisplayInfo: any, taxonomy: string, taxonomyPrefix: string): boolean {
        let idSplitIndex = categoryUri.lastIndexOf('#');
        let categoryName = categoryUri.substr(idSplitIndex + 1);
        return categoryDisplayInfo[categoryUri] != null &&
            categoryUri.indexOf(taxonomyPrefix) !== -1 &&
            this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(categoryName) === -1;
    }

    private sortCatLevels() {
        for (let i = 0; i < this.cat_levels.length; i++) {
            this.cat_levels[i].sort(function (a, b) {
                const a_c: string = a.preferredName;
                const b_c: string = b.preferredName;
                return a_c.localeCompare(b_c);
            });
        }
    }

    private getCatLevel(categoryUri: string, indexCategories: any): number {
        if (categoryUri) {
            let category: any = indexCategories.find(indexCategory => indexCategory.uri === categoryUri);
            return category.allParents != null ? category.allParents.length : 0;
        } else {
            return -1;
        }
    }

    /**
     * When the count sum of the child categories do not sum up to count to the parent category, we add an additional entry
     * under the selected category.
     * For instance:
     * Automative technology (4)
     *  Aircraft (1)
     *  Bicycle (1)
     *
     * In this case, we add an additional entry as follows:
     * Automative technology (4)
     *  Aircraft (1)
     *  Bicycle (1)
     *  Other automative technology (2)
     *
     * This method adds this additional entry
     */
    private populateOtherEntries(): void {
        // a category should have been selected
        // and the cat_levels should non be empty. It can be empty when categories from different taxonomies are used for filtering
        if (this.cat_level === -1 || this.cat_levels.length === 0) {
            return;
        }

        // the selected category should not reside at the deepest level
        if (this.cat_level < (this.cat_levels.length - 1)) {
            let childLevelCount = 0;
            for (let levelEntry of this.cat_levels[this.cat_level + 1]) {
                childLevelCount += levelEntry.count;
            }
            let currentLevelCount: number = this.cat_levels[this.cat_level][0].count;

            let difference: number = currentLevelCount - childLevelCount;
            if (difference > 0) {
                this.cat_levels[this.cat_levels.length - 1].push({
                    'name': 'Other',
                    'id': this.catID,
                    'count': (currentLevelCount - childLevelCount),
                    'preferredName': this.translations['Other'] + ' ' + this.cat_levels[this.cat_level][0].preferredName.toLowerCase(),
                    'other': true
                });
            }
            return;
        }

        // if the 'Others' entry is already selected, there should be an excluding facet query.
        // therefore, we add that entry once again
        if (this.excludingCategoryFacetQueryExists()) {
            // the innermost level should include only the parent category for which the 'other' results are presented.
            // we add an additional level including the other entry
            this.cat_levels.push([]);
            this.cat_levels[this.cat_level + 1].push({
                'name': 'Other',
                'id': this.catID,
                'count': this.cat_levels[this.cat_level][0].count,
                'preferredName': this.translations['Other'] + ' ' + this.cat_levels[this.cat_level][0].preferredName.toLowerCase(),
                'other': true
            });
        }
    }

    private getCall(q: string, fq: any, p: number, rows: number, sort: string, cat: string, catID: string, sIdx: string, sTop: string) {
        this.cat_loading = true;
        if (q == '*') {
            this.model.q = '';
        } else {
            this.model.q = q;
        }
        this.objToSubmit.q = q;
        this.facetQuery = fq;
        this.page = p;
        this.rows = rows;
        this.sort = sort;
        if (this.model.q == '' && this.sort == 'score desc') {
            sort = '{LANG}_label asc';
        }
        this.searchIndex = sIdx;
        this.searchTopic = sTop;
        this.searchCallStatus.submit();
        this.simpleSearchService.getFields()
            .then(fields => {
                let fieldLabels: string[] = this.getFieldNames(fields);
                let idxFields: string[] = this.getIdxFields(fields);
                this.simpleSearchService.get(q, Object.keys(fieldLabels), fq, p, rows, sort, cat, catID, this.searchIndex)
                    .then(res => {
                        if (res.result.length == 0) {
                            this.cat_loading = false;
                            this.callback = true;
                            this.searchCallStatus.callback('Search done.', true);
                            this.response = res.result;
                            this.size = res.totalElements;
                            this.page = p;
                            this.start = this.page * this.rows - this.rows + 1;
                            this.end = this.start + res.result.length - 1;
                            this.displayShoppingCartMessages();
                        } else {
                            this.simpleSearchService.getUblAndQuantityProperties(idxFields).then(response => {
                                this.facetObj = [];
                                this.temp = [];
                                this.manufacturerIdCountMap = new Map();

                                for (let facet in res.facets) {
                                    if (facet == this.product_cat_mix) {
                                        this.categoryCounts = res.facets[this.product_cat_mix].entry;
                                        this.buildCatTree();
                                        this.handleFacets(fieldLabels, res.facets, p, response.result);
                                        // initialize rating and trust filters
                                        this.initializeRatingAndTrustFilters();
                                        break;
                                    }
                                }

                                for (let facet in res.facets) {
                                    if (facet == this.item_manufacturer_id) {
                                        let facetEntries = res.facets[this.item_manufacturer_id].entry;
                                        for (let manufacturerEntry of facetEntries) {
                                            this.manufacturerIdCountMap.set(manufacturerEntry.label, manufacturerEntry.count);
                                        }
                                        //getting the manufacturer ids list
                                        let manufacturerIds = Array.from(this.manufacturerIdCountMap.keys());
                                        this.getCompanyNameFromIds(manufacturerIds).then((res1) => {
                                            this.handleCompanyFacets(res1, 'manufacturer.', this.manufacturerIdCountMap);
                                            //this.cat_loading = false;
                                            this.callback = true;
                                            this.searchCallStatus.callback('Search done.', true);

                                            this.temp = res.result;
                                            for (let doc in this.temp) {
                                                if (this.temp[doc][this.product_img]) {
                                                    const img = this.temp[doc][this.product_img];
                                                    if (Array.isArray(img)) {
                                                        this.temp[doc][this.product_img] = img[0];
                                                    }
                                                }
                                            }

                                            this.response = copy(this.temp);
                                            this.size = res.totalElements;
                                            this.page = p;
                                            this.start = this.page * this.rows - this.rows + 1;
                                            this.end = this.start + res.result.length - 1;
                                            this.displayShoppingCartMessages()
                                        }).catch((error) => {
                                            this.searchCallStatus.error('Error while creating Vendor filters in the search.', error);
                                        });
                                        break;
                                    }
                                }

                            }).catch(error => {
                                this.searchCallStatus.error('Error while running search.', error);
                            });
                            this.fetchImages(res.result, this.product_img);
                        }

                    })
                    .catch(error => {
                        this.searchCallStatus.error('Error while running search.', error);
                    });
            })
            .catch(error => {
                this.searchCallStatus.error('Error while running search.', error);
            });
    }

    private getCompCall(q: string, fq: any, p: number, rows: number, sort: string, sTop: string) {
        this.cat_loading = true;
        if (q == '*') {
            this.model.q = '';
        } else {
            this.model.q = q;
        }
        this.objToSubmit.q = q;
        this.facetQuery = fq;
        this.page = p;
        this.rows = rows;
        this.sort = sort;
        if (this.model.q == '' && this.sort == 'score desc') {
            sort = 'legalName asc';
        }
        this.searchTopic = sTop;
        this.searchCallStatus.submit();
        this.simpleSearchService.getCompFields()
            .then(res => {
                let fieldLabels: string[] = this.getFieldNames(res);
                this.simpleSearchService.getComp(q, Object.keys(fieldLabels), fq, p, rows, sort, this.searchIndex, this.pageRef)
                    .then(res => {
                        if (res.result.length == 0) {
                            this.cat_loading = false;
                            this.callback = true;
                            this.searchCallStatus.callback('Company search done.', true);
                            this.response = res.result;
                            this.size = res.totalElements;
                            this.page = p;
                            this.start = this.page * this.rows - this.rows + 1;
                            this.end = this.start + res.result.length - 1;
                        } else {
                            this.simpleSearchService.getUblAndQuantityProperties(Object.keys(fieldLabels)).then(response => {
                                this.facetObj = [];
                                this.temp = [];
                                this.handleFacets(fieldLabels, res.facets, p, response.result);
                                this.callback = true;
                                // initialize rating and trust filters
                                this.initializeRatingAndTrustFilters();
                                this.searchCallStatus.callback('Company search done.', true);

                                this.temp = res.result;
                                for (let doc in this.temp) {
                                    if (this.temp[doc][this.product_vendor_img]) {
                                        const img = this.temp[doc][this.product_vendor_img];
                                        if (Array.isArray(img)) {
                                            this.temp[doc][this.product_vendor_img] = img[0];
                                        }
                                    }
                                }

                                this.response = copy(this.temp);
                                this.size = res.totalElements;
                                this.page = p;
                                this.start = this.page * this.rows - this.rows + 1;
                                this.end = this.start + res.result.length - 1;
                            }).catch(error => {
                                this.searchCallStatus.error('Error while running company search.', error);
                            })
                        }

                    })
                    .catch(error => {
                        this.searchCallStatus.error('Error while running company search.', error);
                    });
            })
            .catch(error => {
                this.searchCallStatus.error('Error while running company search.', error);
            });
    }

    fetchImages(searchResults: any[], field): void {
        // fetch images asynchronously
        this.imageMap = {};

        let imageMap: any = {};
        for (let result of searchResults) {
            let productImages: string[] = result[field];
            if (productImages != null && productImages.length > 0) {
                imageMap[result.uri] = productImages[0];
            }
        }

        let imageUris: string[] = [];
        for (let productUri in imageMap) {
            imageUris.push(imageMap[productUri]);
        }
        if (imageUris.length > 0) {
            this.catalogueService.getBinaryObjects(imageUris).then(images => {
                for (let image of images) {
                    for (let productUri in imageMap) {
                        if (imageMap[productUri] == image.uri) {
                            this.imageMap[productUri] = 'data:' + image.mimeCode + ';base64,' + image.value
                        }
                    }
                }
            }, () => {
            });
        }
    }

    handleCompanyFacets(res, prefix: string, manufacturerIdCountMap: any) {
        //this.facetObj = [];
        this.temp = [];
        // map for keeping the value counts for each company facet
        // the facet name is the key of the map
        // The value of the map is another map which store the counts for each facet value
        let companyFacetMap = new Map();
        // get available facets
        let companyFacets = this.party_facet_field_list.map(value => value.replace('{LANG}_', (DEFAULT_LANGUAGE() + '_')).replace('{NULL}_', '_'));
        // initialize the companyFacetMap
        companyFacets.forEach(filter => companyFacetMap.set(filter, new Map()));
        // for each result in the response, populate the companyFacetMap
        for (let i = 0; i < res.result.length; i++) {
            let manufacturerId = res.result[i].id;
            // check the response for each facet
            for (let facet of companyFacets) {
                let values = res.result[i][facet];
                // if the facet has an underscore, it means that its value is a Label object
                // therefore, we need to call selectNameFromLabelObject method to retrieve its values properly
                let underscoreIndex = facet.indexOf('_');
                if (underscoreIndex != -1) {
                    let resultFieldForFacet = facet.substring(underscoreIndex + 1);
                    let labels = res.result[i][resultFieldForFacet];
                    values = selectNameFromLabelObject(labels);
                    // append the language id to value for brand names
                    if (facet.endsWith('_brandName') && labels) {
                        let keys = Object.keys(labels);
                        for (let key of keys) {
                            if (labels[key] == values) {
                                values = key + '@' + values;
                            }
                        }
                    }
                }
                // if the facet values are not an array, make it an array
                if (!Array.isArray(values)) {
                    values = [values];
                }

                for (let fieldValue of values) {
                    // we store the values as string to make comparision easier
                    if (typeof fieldValue == 'number') {
                        fieldValue = fieldValue.toString();
                    }
                    if (companyFacetMap.get(facet).has(fieldValue)) {
                        companyFacetMap.get(facet).set(fieldValue, companyFacetMap.get(facet).get(fieldValue) + manufacturerIdCountMap.get(manufacturerId))
                    } else {
                        companyFacetMap.get(facet).set(fieldValue, manufacturerIdCountMap.get(manufacturerId));
                    }
                }

            }
        }

        let inFacetQuery = false;
        let facetQueries = this.facetQuery.map(facet => facet.split(':')[0]);
        // create a facet obj for brand name
        // need to handle it separately since the facet may not be available due to the values coming from different languages
        if (this.party_facet_field_list.indexOf('{LANG}_brandName') != -1) {
            let total = 0;
            let selected = false;
            let genName = 'manufacturer.brandName';
            let name = 'manufacturer.' + DEFAULT_LANGUAGE() + '_brandName';
            let brandNameMap = companyFacetMap.get(DEFAULT_LANGUAGE() + '_brandName');
            let options: any[] = [];
            brandNameMap.forEach((count, brandName) => {
                if (brandName != '') {
                    let delimiterIndex = brandName.indexOf('@');
                    let languageId = brandName.substring(0, delimiterIndex);
                    brandName = brandName.substring(delimiterIndex + 1);
                    options.push({
                        'name': brandName,
                        'realName': brandName,
                        'count': count,
                        'languageId': languageId
                    });
                    total += count;
                    let name = 'manufacturer.' + languageId + '_brandName';
                    if (this.checkFacet(name, brandName)) {
                        selected = true;
                    }
                    let fq = 'manufacturer.' + languageId + '_brandName';
                    if (facetQueries.indexOf(fq) != -1) {
                        inFacetQuery = true;
                    }
                }
            });
            if (total == 0) {
                total = 1;
            }
            this.facetObj.push({
                'name': name,
                'genName': genName,
                'realName': this.getName(genName, this.product_vendor),
                'options': options,
                'showContent': !this.collapsiblePropertyFacets || inFacetQuery,
                'total': total,
                'selected': selected,
                'expanded': false
            });

            this.sortFacetObj(this.facetObj[this.facetObj.length - 1]);
        }
        for (let facet in res.facets) {
            if (this.simpleSearchService.checkField(facet, prefix)) {
                let facet_innerLabel;
                let facet_innerCount;
                let facetCount = 0;

                let name = prefix + res.facets[facet].fieldName;

                let genName = name;
                if (genName.indexOf(DEFAULT_LANGUAGE() + '_') != -1) {
                    genName = genName.replace(DEFAULT_LANGUAGE() + '_', '');
                } else if (genName.indexOf('{NULL}_') != -1) {
                    genName = genName.replace('{NULL}_', '');
                } else if (genName.indexOf(prefix + '_') == 0) {
                    genName = genName.replace('_', '');
                }

                let total = 0;
                let selected = false;

                // skip brand name facet, we handle it separately
                if (genName == 'manufacturer.brandName') {
                    continue;
                }
                //creating options[]
                let options: any[] = [];

                for (let facet_inner of res.facets[facet].entry) {
                    facet_innerLabel = facet_inner.label;
                    facet_innerCount = facet_inner.count;
                    // get the count of values for the facet using companyFacetMap
                    if (companyFacetMap.has(facet)) {
                        facetCount = companyFacetMap.get(facet).get(facet_innerLabel);
                    }

                    if (facet_innerLabel != '' && facet_innerLabel != ':' && facet_innerLabel != ' ' && facet_innerLabel.indexOf('urn:oasis:names:specification:ubl:schema:xsd') == -1) {
                        options.push({
                            'name': facet_inner.label,
                            'realName': facet_innerLabel,
                            'count': facetCount
                        });
                        total += facetCount;
                        if (this.checkFacet(name, facet_inner.label)) {
                            selected = true;
                        }
                    }
                }

                if (total == 0) {
                    total = 1;
                }
                this.facetObj.push({
                    'name': name,
                    'genName': genName,
                    'realName': this.getName(genName, this.product_vendor),
                    'options': options,
                    'showContent': !this.collapsiblePropertyFacets || facetQueries.indexOf(name) != -1,
                    'total': total,
                    'selected': selected,
                    'expanded': false
                });
                this.sortFacetObj(this.facetObj[this.facetObj.length - 1]);
            }
        }

    }

    onFacetClicked(facet: any) {
        if (this.collapsiblePropertyFacets) {
            facet.showContent = !facet.showContent;
        }
    }

    handleFacets(facetMetadata, facets, p, allProperties) {
        this.ublProperties = [];
        let quantityPropertiesLocalNameMap = new Map();
        // populate ublProperties and quantityPropertiesLocalNameMap
        for (let property of allProperties) {
            // ubl properties
            if (property.nameSpace == 'http://www.nimble-project.org/resource/ubl#') {
                this.ublProperties.push(property);
            }
            // quantity properties
            else {
                property.itemFieldNames.forEach(itemField => quantityPropertiesLocalNameMap.set(itemField, property.localName));
            }
        }

        this.facetObj = [];
        this.temp = [];
        let index = 0;
        let facetQueries = this.facetQuery.map(facet => facet.split(':')[0]);
        for (let facet in facets) {
            if (this.simpleSearchService.checkField(facet, '', facetMetadata[facet])) {
                let facetMetadataExists: boolean = facetMetadata[facet] != null && facetMetadata[facet].label != null;
                let genName = facet;
                if (genName.indexOf(DEFAULT_LANGUAGE() + '_') != -1) {
                    genName = genName.replace(DEFAULT_LANGUAGE() + '_', '');
                } else if (genName.indexOf('{NULL}_') != -1) {
                    genName = genName.replace('{NULL}_', '');
                } else if (genName.indexOf('_') == 0) {
                    genName = genName.replace('_', '');
                }
                let propertyLabel;
                if (this.checkCompMainCat(genName)) {
                    propertyLabel = this.getName(genName, this.product_vendor);
                } else {
                    propertyLabel = this.getName(genName);
                }

                // we need to check decimal values separately since they might be the value of a quantity property
                if (facet.endsWith('_dvalues')) {
                    let fieldName = facet.substring(0, facet.length - 8);
                    // if we have this field in quantityPropertiesLocalNameMap, then it's a quantity
                    // otherwise, it's a simple number property
                    if (quantityPropertiesLocalNameMap.has(fieldName)) {
                        // quantity property
                        let localName = quantityPropertiesLocalNameMap.get(fieldName);
                        // get corresponding facet
                        let facetObj = this.facetObj.filter(facet => facet.localName == localName);
                        // quantity unit
                        let unit = fieldName.substring(fieldName.lastIndexOf(localName) + localName.length).toLocaleLowerCase();
                        // we have already created a facet for this property
                        if (facetObj.length > 0) {
                            // get facet
                            facetObj = facetObj[0];
                            // add unit to the facetObj
                            facetObj.units.push(unit);
                            for (let facet_inner of facets[facet].entry) {
                                let facet_innerLabel = facet_inner.label;
                                let facet_innerCount = facet_inner.count;

                                // remove '.0' parts of numerical facets
                                if (facetMetadata[facet] != null && facetMetadata[facet].dataType == 'double' && facet_innerLabel.endsWith('.0')) {
                                    facet_innerLabel = facet_innerLabel.substring(0, facet_innerLabel.length - 2)
                                }

                                if (facet_innerLabel != '' && facet_innerLabel != ':' && facet_innerLabel != ' ' && facet_innerLabel.indexOf('urn:oasis:names:specification:ubl:schema:xsd') == -1) {
                                    facetObj.options.push({
                                        'name': facet_inner.label, // the label with the language id, if there is any
                                        'realName': facet_innerLabel + ' ' + unit, // the displayed label
                                        'count': facet_innerCount,
                                        'unit': unit // unit
                                    });
                                    facetObj.total += facet_innerCount;
                                    if (this.checkFacet(facetObj.name, facet_inner.label)) {
                                        facetObj.selected = true;
                                    }
                                }
                            }

                            this.sortFacetObj(facetObj);


                        }
                        // create a facet for this quantity property
                        else {
                            this.facetObj.push({
                                'name': facet,
                                'genName': genName,
                                'realName': facetMetadataExists ? selectNameFromLabelObject(facetMetadata[facet].label) : propertyLabel,
                                'options': [],
                                'units': [unit], // available units for this quantity properties
                                'selectedUnit': unit, // selected unit in the facet
                                'total': 0,
                                'showContent': !this.collapsiblePropertyFacets || facetQueries.indexOf(facet) != -1,
                                'selected': false,
                                'expanded': false,
                                'localName': localName
                            });

                            for (let facet_inner of facets[facet].entry) {
                                let facet_innerLabel = facet_inner.label;
                                let facet_innerCount = facet_inner.count;

                                // remove '.0' parts of numerical facets
                                if (facetMetadata[facet] != null && facetMetadata[facet].dataType == 'double' && facet_innerLabel.endsWith('.0')) {
                                    facet_innerLabel = facet_innerLabel.substring(0, facet_innerLabel.length - 2)
                                }

                                if (facet_innerLabel != '' && facet_innerLabel != ':' && facet_innerLabel != ' ' && facet_innerLabel.indexOf('urn:oasis:names:specification:ubl:schema:xsd') == -1) {
                                    this.facetObj[index].options.push({
                                        'name': facet_inner.label, // the label with the language id, if there is any
                                        'realName': facet_innerLabel + ' ' + unit, // the displayed label
                                        'count': facet_innerCount,
                                        'unit': unit
                                    });
                                    this.facetObj[index].total += facet_innerCount;
                                    if (this.checkFacet(this.facetObj[index].name, facet_inner.label)) {
                                        this.facetObj[index].selected = true;
                                    }
                                }
                            }


                            this.sortFacetObj(this.facetObj[index]);
                            index++;
                        }
                        continue;
                    }
                }

                this.facetObj.push({
                    'name': facet,
                    'genName': genName,
                    'realName': facetMetadataExists ? selectNameFromLabelObject(facetMetadata[facet].label) : propertyLabel,
                    'options': [],
                    'total': 0,
                    'showContent': !this.collapsiblePropertyFacets || facetQueries.indexOf(facet) != -1,
                    'selected': false,
                    'expanded': false,
                    'dataType': facetMetadata[facet] ? facetMetadata[facet].dataType : null,
                    'localName': null // used for identification of quantity properties
                });

                let label;
                let facet_innerLabel;
                let facet_innerCount;
                let tmp_lang = DEFAULT_LANGUAGE();
                let atLeastOneMultilingualLabel: number = facets[facet].entry.findIndex(facetInner => {
                    const idx = facetInner.label.lastIndexOf('@' + DEFAULT_LANGUAGE());
                    return (idx != -1 && idx + 3 == facetInner.label.length);
                });
                if (atLeastOneMultilingualLabel == -1) {
                    atLeastOneMultilingualLabel = facets[facet].entry.findIndex(facetInner => {
                        const idx = facetInner.label.lastIndexOf('@en');
                        return (idx != -1 && idx + 3 == facetInner.label.length);
                    });
                }
                if (atLeastOneMultilingualLabel == -1) {
                    atLeastOneMultilingualLabel = facets[facet].entry.findIndex(facetInner => {
                        const idx = facetInner.label.lastIndexOf('@');
                        return (idx != -1 && idx + 3 == facetInner.label.length);
                    });
                }
                if (atLeastOneMultilingualLabel != -1) {
                    const idx = facets[facet].entry[atLeastOneMultilingualLabel].label.lastIndexOf('@');
                    tmp_lang = facets[facet].entry[atLeastOneMultilingualLabel].label.substring(idx + 1);
                }
                for (let facet_inner of facets[facet].entry) {
                    facet_innerLabel = facet_inner.label;
                    facet_innerCount = facet_inner.count;
                    //if(facetMetadataExists && facetMetadata[facet].dataType == 'string') {
                    if (atLeastOneMultilingualLabel != -1) {
                        let idx = facet_innerLabel.lastIndexOf('@' + tmp_lang);
                        if (idx != -1) {
                            facet_innerLabel = label = facet_innerLabel.substring(0, idx);
                        } else {
                            // there is at least one label in the preferred language but this is not one of them
                            continue;
                        }
                    }
                    //}

                    // remove '.0' parts of numerical facets
                    if (facetMetadata[facet] != null && facetMetadata[facet].dataType == 'double' && facet_innerLabel.endsWith('.0')) {
                        facet_innerLabel = facet_innerLabel.substring(0, facet_innerLabel.length - 2)
                    }

                    if (facet_innerLabel != '' && facet_innerLabel != ':' && facet_innerLabel != ' ' && facet_innerLabel.indexOf('urn:oasis:names:specification:ubl:schema:xsd') == -1) {
                        this.facetObj[index].options.push({
                            'name': facet_inner.label, // the label with the language id, if there is any
                            'realName': facet_innerLabel, // the displayed label
                            'count': facet_innerCount
                        });
                        this.facetObj[index].total += facet_innerCount;
                        if (this.checkFacet(this.facetObj[index].name, facet_inner.label)) {
                            this.facetObj[index].selected = true;
                        }
                    }
                }
                this.sortFacetObj(this.facetObj[index]);
                index++;
            }
        }
    }

    private sortFacetObj(facetObj: any) {
        facetObj.options.sort(function (a, b) {
            const a_c = a.name;
            const b_c = b.name;
            return a_c.localeCompare(b_c);
        });
        facetObj.options.sort(function (a, b) {
            return b.realName - a.realName;
        });

        this.facetObj.sort(function (a, b) {
            const a_c = a.realName;
            const b_c = b.realName;
            return a_c.localeCompare(b_c);
        });
        this.facetObj.sort(function (a, b) {
            let ret = 0;
            if (a.selected && !b.selected) {
                ret = -1;
            } else if (!a.selected && b.selected) {
                ret = 1;
            }
            return ret;
        });
    }

    private changeTaxonomyId(taxonomyId) {
        if (this.taxonomy != taxonomyId) {
            this.taxonomy = taxonomyId;
            this.buildCatTree();
        }
    }

    private getFieldNames(fields: any[]): any {
        let fieldLabes = {};
        for (let field of fields) {
            fieldLabes[field.fieldName] = {};
            fieldLabes[field.fieldName].label = field.label;
            fieldLabes[field.fieldName].dataType = field.dataType;
        }
        return fieldLabes;
    }

    // we need idx fields only for the double properties
    getIdxFields(fields: any[]): string[] {
        let idxFields = [];
        for (let field of fields) {
            if (field.dynamicBase == '*_dvalues') {
                idxFields.push(field.dynamicPart);
            }
        }
        return idxFields;
    }

    onSubmit(selectedItemEvent = null) {
        // selectedItemEvent is the event emitted when a product/company is selected from the suggestion list
        if (selectedItemEvent) {
            this.model.q = selectedItemEvent.item;
        }
        // for the category search, set the selected category if possible
        if (this.searchIndex === 'Category') {
            // find the suggested category for the search term
            let suggestion = this.categorySuggestions.filter(suggestion => suggestion.label === this.model.q);
            // set the selected category if there is a suggested category for the search term
            // and there is only one category with this label
            if (suggestion.length > 0 && suggestion[0].uris.length == 1 && suggestion[0].label.localeCompare(this.model.q) == 0) {
                this.setCat(this.model.q, suggestion[0].uris[0], false, null);
                return;
            }
        }
        if (this.model.q == '') {
            this.model.q = '*';
        }
        this.objToSubmit = copy(this.model);
        this.page = 1;
        this.get(this.objToSubmit);
    }

    onSearchResultClicked(event): void {
        // if the page reference is publish, we don't let users navigating to product details
        // if the page reference is catalogue, we do not let users navigating to the company details
        if (this.pageRef === 'publish' || this.pageRef === 'network' || this.pageRef === 'offering' || this.pageRef === 'catalogue') {
            event.preventDefault();
        }
    }

    getName(name: string, prefix?: string) {
        // if it is a ubl property, then get its label from the ublProperties
        let prefName = name;
        if (prefix) {
            prefName = prefix + '.' + name;
        }
        for (let ublProperty of this.ublProperties) {
            if (prefName == ublProperty.localName || name == ublProperty.localName) {
                return selectNameFromLabelObject(ublProperty.label);
            }
        }
        // otherwise, use product_filter_mappings
        let ret = prefName;
        if (this.product_filter_mappings[prefName]) {
            ret = this.product_filter_mappings[prefName];
        } else if (this.product_filter_mappings[name]) {
            ret = this.product_filter_mappings[name];
        }
        return ret;
    }

    checkPriceFilter() {
        let check = false;
        if (this.selectedCurrency && (this.selectedPriceMin || this.selectedPriceMax)) {
            check = !(this.selectedPriceMin && this.selectedPriceMax && this.selectedPriceMin > this.selectedPriceMax);
        }
        return check;
    }

    checkTrustFilter() {
        let check = false;
        if (this.ratingTrustFilters.filter(filter => filter.rating > 0).length > 0) {
            check = true;
        }
        return check;
    }

    checkPriceFacet() {
        let found = false;
        for (let i = 0; i < this.facetQuery.length; i++) {
            const comp = this.facetQuery[i].split(':')[0];
            if (comp.localeCompare(this.lowerFirstLetter(this.selectedCurrency) + '_' + this.product_price) == 0) {
                found = true;
            }
        }
        return found;
    }

    checkTrustFacet() {
        let found = false;
        for (let i = 0; i < this.facetQuery.length; i++) {
            const comp = this.facetQuery[i].split(':')[0];
            if (comp.localeCompare(this.product_vendor + '.' + this.product_vendor_rating) == 0 || comp.localeCompare(this.product_vendor + '.' + this.product_vendor_rating_seller) == 0 || comp.localeCompare(this.product_vendor + '.' + this.product_vendor_rating_fulfillment) == 0 || comp.localeCompare(this.product_vendor + '.' + this.product_vendor_rating_delivery) == 0 || comp.localeCompare(this.product_vendor + '.' + this.product_vendor_trust) == 0) {
                found = true;
            }
        }
        return found;
    }

    checkCompTrustFacet() {
        let found = false;
        for (let i = 0; i < this.facetQuery.length; i++) {
            const comp = this.facetQuery[i].split(':')[0];
            if (comp.localeCompare(this.product_vendor_rating) == 0 || comp.localeCompare(this.product_vendor_rating_seller) == 0 || comp.localeCompare(this.product_vendor_rating_fulfillment) == 0 || comp.localeCompare(this.product_vendor_rating_delivery) == 0 || comp.localeCompare(this.product_vendor_trust) == 0) {
                found = true;
            }
        }
        return found;
    }

    setPriceFilter() {
        // use default (0 for min price, Number.MAX_SAFE_INTEGER for max price) min/max prices in case no min/max prices are specified
        let priceMin = this.selectedPriceMin ? this.selectedPriceMin : 0;
        let priceMax = this.selectedPriceMax ? this.selectedPriceMax : Number.MAX_SAFE_INTEGER;
        this.clearFacet(this.lowerFirstLetter(this.selectedCurrency) + '_' + this.product_price);
        this.setRangeWithoutQuery(this.lowerFirstLetter(this.selectedCurrency) + '_' + this.product_price, priceMin, priceMax);
        this.get(this.objToSubmit);
    }

    setTrustFilter() {
        this.clearFacet(this.product_vendor_rating, this.product_vendor);
        this.clearFacet(this.product_vendor_rating_seller, this.product_vendor);
        this.clearFacet(this.product_vendor_rating_fulfillment, this.product_vendor);
        this.clearFacet(this.product_vendor_rating_delivery, this.product_vendor);
        this.clearFacet(this.product_vendor_trust, this.product_vendor);

        this.ratingTrustFilters.forEach(filter => {
            if (filter.rating > 0) {
                let max = 5;
                let rating = filter.rating;
                if (filter.name === this.product_vendor_trust) {
                    rating = (filter.rating / 5);
                    max = 1;
                }
                this.setRangeWithoutQuery(filter.name, rating, max, this.product_vendor);
            }
        });
        this.get(this.objToSubmit);
    }

    setCompTrustFilter() {
        this.clearFacet(this.product_vendor_rating);
        this.clearFacet(this.product_vendor_rating_seller);
        this.clearFacet(this.product_vendor_rating_fulfillment);
        this.clearFacet(this.product_vendor_rating_delivery);
        this.clearFacet(this.product_vendor_trust);
        this.ratingTrustFilters.forEach(filter => {
            if (filter.rating > 0) {
                let max = 5;
                let rating = filter.rating;
                if (filter.name === this.product_vendor_trust) {
                    rating = (filter.rating / 5);
                    max = 1;
                }
                this.setRangeWithoutQuery(filter.name, rating, max);
            }
        });
        this.get(this.objToSubmit);
    }

    resetPriceFilter() {
        this.selectedCurrency = myGlobals.config.standardCurrency;
        this.selectedPriceMin = null;
        this.selectedPriceMax = null;
        this.clearFacet(this.lowerFirstLetter(this.selectedCurrency) + '_' + this.product_price);
        this.get(this.objToSubmit);
    }

    resetTrustFilter() {
        this.ratingTrustFilters.forEach(filter => filter.rating = 0);
        if (this.checkTrustFacet()) {
            this.clearFacet(this.product_vendor_rating, this.product_vendor);
            this.clearFacet(this.product_vendor_rating_seller, this.product_vendor);
            this.clearFacet(this.product_vendor_rating_fulfillment, this.product_vendor);
            this.clearFacet(this.product_vendor_rating_delivery, this.product_vendor);
            this.clearFacet(this.product_vendor_trust, this.product_vendor);
            this.get(this.objToSubmit);
        }
    }

    resetCompTrustFilter() {
        this.ratingTrustFilters.forEach(filter => filter.rating = 0);
        this.clearFacet(this.product_vendor_rating);
        this.clearFacet(this.product_vendor_rating_seller);
        this.clearFacet(this.product_vendor_rating_fulfillment);
        this.clearFacet(this.product_vendor_rating_delivery);
        this.clearFacet(this.product_vendor_trust);
        this.get(this.objToSubmit);
    }

    checkProdCat(categoryName: string) {
        let found = false;
        if (this.productServiceFiltersEnabled) {
            if (this.product_filter_prod.indexOf(categoryName) != -1) {
                found = true;
            }
        } else {
            for (let nonFilter of this.product_nonfilter_regex) {
                if (categoryName.search(nonFilter) != -1) {
                    return false;
                }
            }
            return this.product_filter_prod.indexOf(categoryName) == -1 && !this.checkCompCat(name) && !this.checkTrustCat(name);
        }
        return found;
    }

    checkProdCatCount() {
        // if product/service filters are enabled, we have the price filter by default
        let count = this.productServiceFiltersEnabled ? 1 : 0;
        if (this.facetObj) {
            for (let i = 0; i < this.facetObj.length; i++) {
                if (this.checkProdCat(this.facetObj[i].name)) {
                    count++;
                }
            }
        }
        return count;
    }

    checkCompCat(categoryName: string) {
        let found = false;
        if (this.product_filter_comp.indexOf(categoryName) != -1) {
            found = true;
        }
        return found;
    }

    checkCompCatCount() {
        let count = 0;
        if (this.facetObj) {
            for (let i = 0; i < this.facetObj.length; i++) {
                if (this.checkCompCat(this.facetObj[i].genName)) {
                    count++;
                }
            }
        }
        return count;
    }

    checkTrustCat(name: string) {
        let found = false;
        if (this.product_filter_trust.indexOf(name) != -1) {
            found = true;
        }
        return found;
    }

    checkOtherCat(name: string) {
        for (let nonFilter of this.product_nonfilter_regex) {
            if (name.search(nonFilter) != -1) {
                return false;
            }
        }
        return (!this.checkProdCat(name) && !this.checkCompCat(name) && !this.checkTrustCat(name));
    }

    checkOtherCatCount() {
        if (!this.productServiceFiltersEnabled) {
            return 0;
        }
        let count = 0;
        if (this.facetObj) {
            for (let i = 0; i < this.facetObj.length; i++) {
                if (this.checkOtherCat(this.facetObj[i].name)) {
                    count++;
                }
            }
        }
        return count;
    }

    checkCompMainCat(name: string) {
        let found = false;
        if (this.party_filter_main.indexOf(name) != -1) {
            found = true;
        }
        return found;
    }

    checkCompMainCatCount() {
        let count = 0;
        if (this.facetObj) {
            for (let i = 0; i < this.facetObj.length; i++) {
                if (this.checkCompMainCat(this.facetObj[i].genName)) {
                    count++;
                }
            }
        }
        return count;
    }

    checkCompTrustCat(name: string) {
        let found = false;
        if (this.party_filter_trust.indexOf(name) != -1) {
            found = true;
        }
        return found;
    }

    checkCompTrustCatCount() {
        let count = 0;
        if (this.facetObj) {
            for (let i = 0; i < this.facetObj.length; i++) {
                if (this.checkCompTrustCat(this.facetObj[i].name)) {
                    count++;
                }
            }
        }
        return count;
    }

    isFacetSelectable(fieldQuery: string): boolean {
        // eliminate the field queries that are used to filter results when the 'Others' entry is selected in the category panel
        return !fieldQuery.startsWith(`-${this.product_cat_mix}`);

    }

    clearFacet(outer: string, prefix?: string) {
        if (prefix) {
            outer = prefix + '.' + outer;
        }
        let idx = -1;
        for (let i = 0; i < this.facetQuery.length; i++) {
            const comp = this.facetQuery[i].split(':')[0];
            if (comp.localeCompare(outer) == 0) {
                idx = i;
            }
        }
        if (idx >= 0) {
            this.facetQuery.splice(idx, 1);
        }
    }

    getFacetName(facet: string): string {
        let name = facet;
        for (let i = 0; i < this.facetObj.length; i++) {
            const comp = this.facetObj[i].name;
            if (comp.localeCompare(facet) == 0) {
                name = this.facetObj[i].realName;
            }
        }
        return this.getName(name);
    }

    getFacetQueryName(facet: string): string {
        let name = facet.split(':')[0];
        let containsLanguageId = false;
        // check whether the facet contains any language id
        for (let languageId of this.config.languageSettings.available) {
            if (name.indexOf(languageId + '_') != -1) {
                name = name.replace(languageId + '_', '');
                containsLanguageId = true;
            }
        }
        if (!containsLanguageId) {
            if (name.indexOf('{NULL}_') != -1) {
                name = name.replace('{NULL}_', '');
            } else if (name.indexOf('_') == 0) {
                name = name.replace('_', '');
            } else if (name.indexOf('._') != -1) {
                name = name.replace('._', '.');
            }
        }
        name = this.getFacetName(name);
        return name;
    }

    getFacetQueryValue(facet: string): string {
        let value = facet.split(':')[1];
        value = value.split('@')[0];
        value = value.replace(/"/g, '');
        return value;
    }

    clearFacetQuery(facet: string) {
        this.facetQuery.splice(this.facetQuery.indexOf(facet), 1);
        this.get(this.objToSubmit);
    }

    setFacet(outer: string, inner: string, genName: string, languageId?: string) {
        let fq = outer + ':"' + inner + '"';
        // handle brand name facet separately since it can contain values for different languages
        if (genName == 'manufacturer.brandName') {
            fq = 'manufacturer.' + languageId + '_brandName:"' + inner + '"';
        }
        if (this.facetQuery.indexOf(fq) == -1) {
            this.facetQuery.push(fq);
        } else {
            this.facetQuery.splice(this.facetQuery.indexOf(fq), 1);
        }
        this.get(this.objToSubmit);
    }

    setRangeWithoutQuery(outer: string, min: number, max: number, prefix?: string) {
        if (prefix) {
            outer = prefix + '.' + outer;
        }
        const fq = outer + ':[' + min + ' TO ' + max + ']';
        this.facetQuery.push(fq);
    }

    excludingCategoryFacetQueryExists(): boolean {
        for (let facetQuery of this.facetQuery) {
            if ((<string>facetQuery).indexOf(`-${this.product_cat_mix}`) !== -1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Sets the category name and category id and initiate a new search request.
     * @param name category name
     * @param id category id
     * @param excludeCategoriesAtCurrentLevel indicates that user has selected the "Other" entry in the category hierarchy.
     * This requires that the search must be performed with the parent category by excluding all the children
     * @param level the level of the selected category
     */
    setCat(name: string, id: string, excludeCategoriesAtCurrentLevel = false, level: number) {
        this.cat = name;
        this.catID = id;
        this.cat_level = level;

        if (!excludeCategoriesAtCurrentLevel) {
            // remove the category related filters
            let newFacetQueryList: any[] = [];
            for (let facetQuery of this.facetQuery) {
                if ((<string>facetQuery).indexOf(`-${this.product_cat_mix}`) === -1) {
                    newFacetQueryList.push(facetQuery);
                }
            }
            this.facetQuery = newFacetQueryList;

        } else {
            // others entry clicked and selected
            if (id !== '') {
                // child categories of the selected are excluded via the field query
                let catLevel: number = this.cat_level;
                // do not add the "Other" entry to the filter query
                for (let i = 0; i < this.cat_levels[catLevel].length - 1; i++) {
                    this.facetQuery.push(`-${this.product_cat_mix}:"${this.cat_levels[catLevel][i].id}"`);
                }

                // others entry clicked and deselected
            } else {
                // remove the category related filters
                let newFacetQueryList: any[] = [];
                for (let facetQuery of this.facetQuery) {
                    if ((<string>facetQuery).indexOf(`-${this.product_cat_mix}`) === -1) {
                        newFacetQueryList.push(facetQuery);
                    }
                }
                this.facetQuery = newFacetQueryList;
            }
        }

        this.get(this.objToSubmit);
    }

    resetFilter() {
        this.facetQuery = [];
        this.selectedCurrency = myGlobals.config.standardCurrency;
        this.selectedPriceMin = null;
        this.selectedPriceMax = null;
        this.ratingTrustFilters.forEach(filter => filter.rating = 0);
        this.get(this.objToSubmit);
    }

    resetSearch() {
        this.model.q = '*';
        this.objToSubmit.q = '*';
        this.get(this.objToSubmit);
    }

    checkFacet(outer: string, inner: string, languageId?: string): boolean {
        let match = false;
        let fq = outer + ':"' + inner + '"';
        // language id is available only for the brand name facet
        if (languageId) {
            fq = 'manufacturer.' + languageId + '_brandName:"' + inner + '"';
        }
        if (this.facetQuery.indexOf(fq) != -1) {
            match = true;
        }
        return match;
    }

    getCurrency(price: any): string {
        if (price[this.selectedCurrency]) {
            return this.selectedCurrency;
        }
        if (this.selectedCurrency != myGlobals.config.standardCurrency && price[myGlobals.config.standardCurrency]) {
            return myGlobals.config.standardCurrency;
        }
        if (this.selectedCurrency != 'EUR' && price['EUR']) {
            return 'EUR';
        }
        return Object.keys(price)[0];
    }

    getCurrencySort(order: any): string {
        let currency = myGlobals.config.standardCurrency;
        let currentFirstLower = currency.charAt(0).toLowerCase() + currency.slice(1);
        return (currentFirstLower + '_price ' + order);
    }

    getCategoryDisplayInfo(indexCategories: any, categoryCounts: any): any {
        let labelMap = {};
        for (let category of indexCategories.result) {
            labelMap[category.uri] = {};
            labelMap[category.uri].label = category.label;
            labelMap[category.uri].code = category.code;
            labelMap[category.uri].isRoot = category.allParents == null;
            let searchCategory: any = categoryCounts.find(categoryCount => category.uri === categoryCount.label);
            if (searchCategory) {
                labelMap[category.uri].count = searchCategory.count;
            }
        }
        return labelMap;
    }

    checkNaN(rating: any): boolean {
        let nan = false;
        if (isNaN(parseFloat(rating))) {
            nan = true;
        }
        return nan;
    }

    checkEmpty(obj: any): boolean {
        return (Object.keys(obj).length === 0);
    }

    calcRating(rating: any, multiplier: number): number {
        const result = parseFloat(rating) * multiplier;
        return Math.round(result * 10) / 10;
    }

    lowerFirstLetter(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    getCompanyNameFromIds(idList: any[]): Promise<any> {
        let facets = this.party_facet_field_list.slice();
        for (let i = 0; i < facets.length; i++) {
            facets[i] = facets[i].replace('{LANG}_', (DEFAULT_LANGUAGE() + '_'));
            facets[i] = facets[i].replace('{NULL}_', '_');
        }
        let query = '';
        let length = idList.length;
        while (length--) {
            query = query + 'id:' + idList[length];
            if (length != 0) {
                query = query + ' OR ';
            }
        }
        return this.simpleSearchService.getCompanies(query, facets, idList);
    }

    getProdLink(res: any): string {
        let link = '';
        if (res && res.catalogueId && res.manufactuerItemId) {
            // when the seller is navigated to the search to find a transport service for the ordered products, searchContextService is set.
            // however, since we do not clear searchContextService, need to check whether its context is valid or not and pass this info as query param to product-details page
            // to check its validity, we use this.searchContext variable which is not null iff the seller is navigated to the search page to find a transport service provider
            let isSearchContextValid = this.searchContext && this.searchContext == 'orderbp';
            link += '#/product-details?catalogueId=' + res.catalogueId + '&id=' + res.manufactuerItemId + '&contextValid=' + isSearchContextValid;
        }
        return link;
    }

    getCompLink(res: any): string {
        let link = '';
        if (res && res.id) {
            if (!res.isFromLocalInstance && res.nimbleInstanceName && res.nimbleInstanceName != '') {
                link += '#/user-mgmt/company-details?id=' + res.id + '&delegateId=' + res.nimbleInstanceName;
            } else {
                link += '#/user-mgmt/company-details?id=' + res.id;
            }
        }
        return link;
    }

    productSelected(productHjid): boolean {
        let i: number = this.productsSelectedForPublish.findIndex(product => product.uri === productHjid);
        return i !== -1;
    }

    onToggleProductSelectForPublish(toggledProduct: any, event): void {
        event.preventDefault();
        // set timeout is required since the default checkbox implementation prevents updating status of the checkbox
        setTimeout(() => {
            let i: number = this.productsSelectedForPublish.findIndex(product => product.uri === toggledProduct.uri);
            if (i === -1) {
                this.productsSelectedForPublish.push(toggledProduct);
            } else {
                this.onRemoveSelectedProduct(toggledProduct.uri);
            }
        });
    }

    onRemoveSelectedProduct(removedProductHjid: any): void {
        let selectedIndex: number = this.productsSelectedForPublish.findIndex(product => product.uri === removedProductHjid);
        this.productsSelectedForPublish.splice(selectedIndex, 1);
    }

    onContinuePublishing(): void {
        this.publishService.selectedProductsInSearch = this.productsSelectedForPublish.map(product => {
            return {hjid: product.uri, label: product.label};
        });
        this.router.navigate(['catalogue/publish'], {queryParams: {pg: 'single', productType: 'product', searchRef: 'true'}});
    }

    // methods for network functionality
    isCompanySelectedForNetwork(vatNumber): boolean {
        return this.networkCompanyListService.isCompanySelected(vatNumber);
    }

    onToggleCompanySelectForNetwork(toggledCompany: any, event): void {
        event.preventDefault();
        // set timeout is required since the default checkbox implementation prevents updating status of the checkbox
        setTimeout(() => {
            if (this.networkCompanyListService.isCompanySelected(toggledCompany.vatNumber)) {
                this.onRemoveSelectedCompanyFromNetwork(toggledCompany.vatNumber);
            } else {
                this.networkCompanyListService.onAddSelectedCompany(toggledCompany)
            }
        });
    }

    onRemoveSelectedCompanyFromNetwork(company: any): void {
        this.networkCompanyListService.onRemoveSelectedCompany(company);
    }

    // the end of methods for network functionality

    // methods for white list/black list functionality
    isCompanySelected(vatNumber: string): boolean {
        return this.whiteBlackListService.isCompanySelected(vatNumber);
    }

    onToggleCompanySelectForWhiteBlackList(toggledCompany: any, event): void {
        event.preventDefault();
        // set timeout is required since the default checkbox implementation prevents updating status of the checkbox
        setTimeout(() => {
            if (this.whiteBlackListService.isCompanySelected(toggledCompany.vatNumber)) {
                this.onRemoveSelectedCompany(toggledCompany.vatNumber);
            } else {
                this.whiteBlackListService.onAddSelectedCompany(toggledCompany)
            }
        });
    }

    onRemoveSelectedCompany(removedCompanyVatNumber: any): void {
        this.whiteBlackListService.onRemoveSelectedCompany(removedCompanyVatNumber);
    }

    // the end of methods for white list/black list functionality
    onNavigateToCatalogue(): void {
        this.router.navigate(['dashboard'], {queryParams: {tab: 'CATALOGUE', searchRef: 'true'}})
    }

    onNavigate(toNetwork: boolean) {
        if (toNetwork) {
            this.router.navigate(['/user-mgmt/company-settings'], {queryParams: {tab: 'NETWORK', searchRef: 'true'}})
        } else {
            this.router.navigate(['/dashboard'], {queryParams: {tab: 'CATALOGUE', searchRef: 'true'}})
        }
    }

    onAddToCart(result: any, index: number, event: any): void {
        event.preventDefault();
        // check whether the item can be added to the cart
        let isProductAddable: boolean = this.shoppingCartDataService.isProductAddableToCart(result.catalogueId, result.manufactuerItemId);
        if (!isProductAddable) {
            return;
        }

        // do not add item to the cart if a process is still being added
        for (let shoppingCartCallStatus of this.shoppingCartCallStatuses) {
            if (shoppingCartCallStatus.isLoading()) {
                return;
            }
        }
        // get corresponding call status for product
        let shoppingCartCallStatus = this.getShoppingCartStatus(index);
        shoppingCartCallStatus.submit();

        this.shoppingCartDataService.addItemToCart(result.uri, 1, result.nimbleInstanceName).then(() => {
            shoppingCartCallStatus.callback(this.translate.instant('Product is added to shopping cart.'), false);
        }).catch(() => {
            shoppingCartCallStatus.error(null);
        });
    }

    getShoppingCartStatus(index: number): CallStatus {
        return this.shoppingCartCallStatuses[index % this.rows];
    }

    // display a message for the products included in the shopping cart
    displayShoppingCartMessages() {
        this.shoppingCartDataService.getShoppingCart().then(shoppingCart => {
            // reset all call statuses
            for (let callStatus of this.shoppingCartCallStatuses) {
                callStatus.reset();
            }

            let size = this.response.length;
            for (let i = 0; i < size; i++) {
                let result = this.response[i];
                if (UBLModelUtils.isProductInCart(shoppingCart, result.catalogueId, result.manufactuerItemId)) {
                    this.getShoppingCartStatus(i).callback(this.translate.instant('Product is added to shopping cart.'), false);
                }
            }
        });
    }
}
