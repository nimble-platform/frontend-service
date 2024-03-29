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

import {Component, OnInit} from '@angular/core';
import {CookieService} from 'ng2-cookies';
import {CatalogueService} from '../catalogue.service';
import {SimpleSearchService} from '../../simple-search/simple-search.service';
import {CallStatus} from '../../common/call-status';
import {CategoryService} from '../category/category.service';
import {UserService} from '../../user-mgmt/user.service';
import {CompanySettings} from '../../user-mgmt/model/company-settings';
import {Item} from '../model/publish/item';
import {copy, roundToTwoDecimals, selectName, selectNameFromLabelObject} from '../../common/utils';
import {ItemProperty} from '../model/publish/item-property';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {CATALOGUE_LINE_SORT_OPTIONS, FAVOURITE_LINEITEM_PUT_OPTIONS} from '../model/constants';
import * as myGlobals from '../../globals';
import {Search} from '../../simple-search/model/search';

@Component({
    selector: 'compare-view',
    templateUrl: './compare-view.component.html',
    styleUrls: ['./compare-view.component.css'],
    providers: [CookieService]
})

export class CompareViewComponent implements OnInit {

    itemTypeResponse: any = [];
    itemTypeResponse_first: any = [];
    settings: CompanySettings;
    ublProperties = null;

    // available catalogue lines with respect to the selected category
    catalogueLinesWRTTypes: any = [];
    catalogueLinesWRTTypes_first: any = [];
    // catalogue lines which are available to the user after search operation
    catalogueLinesArray: any = [];
    catalogueLinesArray_first: any = [];

    // necessary info for pagination
    collectionSize = 0;
    page = 1;
    // default
    pageSize = 10;

    // check whether catalogue-line-panel should be displayed for a specific catalogue line
    catalogueLineView = {};
    catalogueLineView_first = {};
    searchIndex = 'Name';

    sortOption = null;
    model = new Search('');
    searchFavouriteCallStatus: CallStatus = new CallStatus();

    getCatalogueStatus = new CallStatus();
    callStatus = new CallStatus();
    deleteStatuses: CallStatus[] = [];
    imageMap: any = {};
    imageMap_first: any = {};
    facetObj: any;
    temp: any;
    selectedCategory = 'All';
    searchText: string = '';
    searchText_first: string = '';
    status = 1;
    hasFavourite = false;
    hasFavourite_first = false;
    favouriteIdList = [];
    showDetails = false;
    showDetails_first = false;
    getMultilingualLabel = selectNameFromLabelObject;

    product_filter_mappings = myGlobals.product_filter_mappings;
    item_manufacturer_id = myGlobals.item_manufacturer_id;
    party_facet_field_list = myGlobals.party_facet_field_list;
    product_img = myGlobals.product_img;
    product_name = myGlobals.product_name;
    product_price = myGlobals.product_price;
    product_description = myGlobals.product_description;
    product_cat_mix = myGlobals.product_cat_mix;
    config = myGlobals.config;
    roundToTwoDecimals = roundToTwoDecimals;
    cat_level = -2;
    cat_levels = [];
    cat = '';
    comapanyList = {};
    comapanyList_first = {};
    catLineList = {};
    catLineList_first = {};
    selectedCurrency: any = myGlobals.config.standardCurrency;
    initial = true;
    firstSearch = false;
    manufacturerIdCountMap: any;
    favouriteItemIds: string[] = [];
    addFavoriteCategoryStatus: CallStatus = new CallStatus();


    constructor(private cookieService: CookieService,
                private simpleSearchService: SimpleSearchService,
                private catalogueService: CatalogueService,
                private categoryService: CategoryService,
                private userService: UserService) {
    }

    ngOnInit() {
        this.hasFavourite = false;
        this.hasFavourite_first = false;
        for (let i = 0; i < this.pageSize; i++) {
            this.deleteStatuses.push(new CallStatus());
        }

        let userId = this.cookieService.get('user_id');
        this.callStatus.submit();
        this.userService.getPerson(userId)
            .then(person => {
                this.callStatus.callback('Successfully loaded user profile', true);
                this.favouriteItemIds = person.favouriteProductID;
            })
            .catch(error => {
                this.callStatus.error('Invalid credentials', error);
            });
    }

    selectName(ip: ItemProperty | Item) {
        return selectName(ip);
    }

    checkEmpty(obj: any): boolean {
        return (Object.keys(obj).length === 0);
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

    searchFavourite_first = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term =>
                this.simpleSearchService.getSuggestions(term, this.searchIndex)
            )
        );

    searchFavouriteSearch_first(selectedItemEvent = null) {
        // selectedItemEvent is the event emitted when a product/company is selected from the suggestion list
        if (selectedItemEvent) {
            this.searchText_first = selectedItemEvent.item;
        }
        this.catalogueLinesArray_first = [];
        this.firstSearch = true;
        this.requestCatalogue(this.searchText_first);
        return [];
    }

    searchFavourite = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term =>
                this.simpleSearchService.getSuggestions(term, this.searchIndex)
            )
        );

    searchFavouriteSearch(selectedItemEvent = null) {
        // selectedItemEvent is the event emitted when a product/company is selected from the suggestion list
        if (selectedItemEvent) {
            this.searchText = selectedItemEvent.item;
        }
        this.catalogueLinesArray = [];
        this.requestCatalogue(this.searchText);
        this.firstSearch = false;
        return [];
    }

    requestCatalogue(termText?: String): void {
        let term = termText != null ? termText : this.searchText;
        this.getCatalogueStatus.submit();
        this.initial = true;
        const userId = this.cookieService.get('user_id');
        // check whether the user chose a category to filter the catalogue lines
        this.sortOption = this.sortOption == null ? CATALOGUE_LINE_SORT_OPTIONS[0].name : this.sortOption;
        let categoryURI = this.selectedCategory == 'All' ? null : this.selectedCategory;
        this.userService.getPerson(userId)
            .then((person) => {
                this.favouriteIdList = person.favouriteProductID;
                this.collectionSize = person.favouriteProductID.length;

                if (categoryURI != null) {
                    this.initial = false;
                }

                if (term != null && term != '') {
                    this.initial = false;
                }
                this.getCall(term.toString());
                this.getCatalogueStatus.callback(null);
            })
            .catch(error => {
                this.getCatalogueStatus.error('Failed to get catalogue', error);
            });
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

    getCategoryDisplayInfo(categories: any): any {
        let labelMap = {};
        for (let category of categories.result) {
            labelMap[category.uri] = {};
            labelMap[category.uri].label = category.label;
            labelMap[category.uri].code = category.code;
            labelMap[category.uri].isRoot = category.allParents == null ? true : false;
        }
        return labelMap;
    }

    private sortCatLevels() {
        for (var i = 0; i < this.cat_levels.length; i++) {
            this.cat_levels[i].sort(function (a, b) {
                var a_c: string = a.name;
                var b_c: string = b.name;
                return a_c.localeCompare(b_c);
            });
            this.cat_levels[i].sort(function (a, b) {
                return b.count - a.count;
            });
        }
        this.cat_level = this.getCatLevel(this.cat);
    }

    private getCatLevel(name: string): number {
        var level = -2;
        if (name != '') {
            level = -1;
        }
        for (var j = 0; j < this.cat_levels.length; j++) {
            for (var i = 0; i < this.cat_levels[j].length; i++) {
                var comp = this.cat_levels[j][i].name;
                if (comp.localeCompare(name) == 0) {
                    level = j;
                }
            }
        }
        return level;
    }

    private async buildCatTree(categoryCounts: any[]) {
        var taxonomy = 'eClass';
        if (this.config.standardTaxonomy.localeCompare('All') != 0 && this.config.standardTaxonomy.localeCompare('eClass') != 0) {
            taxonomy = this.config.standardTaxonomy;
        }
        var taxonomyPrefix = '';
        if (this.config.categoryFilter[taxonomy] && this.config.categoryFilter[taxonomy].ontologyPrefix) {
            taxonomyPrefix = this.config.categoryFilter[taxonomy].ontologyPrefix;
        }

        // retrieve the labels for the category uris included in the categoryCounts field
        let categoryUris: string[] = [];
        for (let categoryCount of categoryCounts) {
            categoryUris.push(categoryCount.label);
        }
        // this.cat_loading = true;
        var indexCategories = await this.categoryService.getCategories(categoryUris);
        let categoryDisplayInfo: any = this.getCategoryDisplayInfo(indexCategories);

        let split_idx: any = -1;
        let name: any = '';
        if (taxonomyPrefix != '') {
            // ToDo: Remove manual distinction after search update
            // ================================================================================
            if (taxonomy == 'eClass') {
                this.cat_levels = [[], [], [], []];
                for (let categoryCount of categoryCounts) {
                    let facet_inner = categoryCount.label;
                    var count = categoryCount.count;
                    if (facet_inner.startsWith(taxonomyPrefix)) {
                        var eclass_idx = categoryDisplayInfo[facet_inner].code;
                        if (eclass_idx % 1000000 == 0) {
                            this.cat_levels[0].push({
                                'name': facet_inner,
                                'id': facet_inner,
                                'count': count,
                                'preferredName': selectNameFromLabelObject(categoryDisplayInfo[facet_inner].label)
                            });
                        } else if (eclass_idx % 10000 == 0) {
                            this.cat_levels[0].push({
                                'name': facet_inner,
                                'id': facet_inner,
                                'count': count,
                                'preferredName': selectNameFromLabelObject(categoryDisplayInfo[facet_inner].label)
                            });
                        } else if (eclass_idx % 100 == 0) {
                            this.cat_levels[0].push({
                                'name': facet_inner,
                                'id': facet_inner,
                                'count': count,
                                'preferredName': selectNameFromLabelObject(categoryDisplayInfo[facet_inner].label)
                            });
                        } else {
                            this.cat_levels[0].push({
                                'name': facet_inner,
                                'id': facet_inner,
                                'count': count,
                                'preferredName': selectNameFromLabelObject(categoryDisplayInfo[facet_inner].label)
                            });
                        }
                    }
                }
                this.sortCatLevels();
            }
            // ================================================================================
            // if (this.cat == "") {
            else if (this.cat == '') {
                this.cat_levels = [];
                var lvl = [];
                for (let categoryCount of categoryCounts) {
                    var count = categoryCount.count;
                    var ontology = categoryCount.label;
                    if (categoryDisplayInfo[ontology] != null && ontology.indexOf(taxonomyPrefix) != -1) {
                        split_idx = ontology.lastIndexOf('#');
                        name = ontology.substr(split_idx + 1);
                        if (categoryDisplayInfo[ontology].isRoot && this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(name) == -1) {
                            if (ontology.startsWith(taxonomyPrefix)) {
                                lvl.push({
                                    'name': ontology,
                                    'id': ontology,
                                    'count': count,
                                    'preferredName': selectNameFromLabelObject(categoryDisplayInfo[ontology].label)
                                });
                            } else {
                                lvl.push({'name': ontology, 'id': ontology, 'count': count, 'preferredName': ontology});
                            }
                        }
                    }
                }
                this.cat_levels.push(lvl);
                this.sortCatLevels();
            } else {
                var catLevels = [];
                this.cat_levels = [];
                for (var i = 0; i < catLevels.length; i++) {
                    var lvl = [];
                    var constructedLevel: string[] = catLevels[i];
                    for (let uri of constructedLevel) {
                        let categoryCount = categoryCounts.find(cat => cat.label == uri);
                        if (categoryCount != null) {
                            var count = categoryCount.count;
                            var ontology = categoryCount.label;

                            if (categoryDisplayInfo[uri] != null && uri.indexOf(taxonomyPrefix) != -1) {
                                split_idx = uri.lastIndexOf('#');
                                name = uri.substr(split_idx + 1);
                                if (this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(name) == -1) {
                                    if (ontology.startsWith(taxonomyPrefix)) {
                                        lvl.push({
                                            'name': uri,
                                            'id': uri,
                                            'count': count,
                                            'preferredName': selectNameFromLabelObject(categoryDisplayInfo[uri].label)
                                        });
                                    } else {
                                        lvl.push({'name': uri, 'id': uri, 'count': count, 'preferredName': name});
                                    }
                                }
                            }
                        }
                    }
                    this.cat_levels.push(lvl);
                }
                this.sortCatLevels();
            }
        }
    }


    private getCall(q: string) {
        this.model.q = q;

        this.searchFavouriteCallStatus.submit();
        this.simpleSearchService.getFields()
            .then(res => {
                let fieldLabels: string[] = this.getFieldNames(res);
                this.simpleSearchService.get(q, Object.keys(fieldLabels), [], this.page, 10, 'score desc', '', this.sortOption, this.searchIndex)
                    .then(res => {
                        if (res.result.length == 0) {
                            this.searchFavouriteCallStatus.callback('Search done.', true);
                        } else {
                            this.facetObj = [];
                            this.temp = [];
                            this.manufacturerIdCountMap = new Map();
                            for (let facet in res.facets) {
                                if (facet == this.product_cat_mix) {
                                    this.buildCatTree(res.facets[this.product_cat_mix].entry);
                                    break;
                                }
                            }

                            for (let facet in res.facets) {
                                if (facet == this.item_manufacturer_id) {
                                    let facetEntries = res.facets[this.item_manufacturer_id].entry;
                                    for (let manufacturerEntry of facetEntries) {
                                        this.manufacturerIdCountMap.set(manufacturerEntry.label, manufacturerEntry.count);
                                    }

                                    this.temp = res.result;
                                    for (let doc in this.temp) {
                                        if (this.temp[doc][this.product_img]) {
                                            var img = this.temp[doc][this.product_img];
                                            if (Array.isArray(img)) {
                                                this.temp[doc][this.product_img] = img[0];
                                            }
                                        }
                                    }

                                    if (this.temp.length > 0) {
                                        if (this.firstSearch) {
                                            this.itemTypeResponse_first = copy(this.temp);
                                            this.hasFavourite_first = true;
                                        } else {
                                            this.itemTypeResponse = copy(this.temp);
                                            this.hasFavourite = true;
                                        }
                                        this.init();
                                    } else {
                                        if (this.firstSearch) {
                                            this.hasFavourite_first = false
                                        } else {
                                            this.hasFavourite = false;
                                        }
                                    }

                                    break;
                                }
                            }

                            this.fetchImages(res.result);
                            this.searchFavouriteCallStatus.callback('Search done.', true);
                        }

                    })
                    .catch(error => {
                        this.searchFavouriteCallStatus.error('Error while running search.', error);
                    });
            })
            .catch(error => {
                this.searchFavouriteCallStatus.error('Error while running search.', error);
            });
    }

    fetchImages(searchResults: any[]): void {
        // fetch images asynchronously
        if (this.firstSearch) {
            this.imageMap_first = {};

            let imageMap_first: any = {};
            for (let result of searchResults) {
                let productImages: string[] = result.imgageUri;
                if (productImages != null && productImages.length > 0) {
                    imageMap_first[result.uri] = productImages;
                }
            }

            let imageUris_first: string[] = [];
            for (let productUri in imageMap_first) {
                imageUris_first.push(imageMap_first[productUri]);
            }
            if (imageUris_first.length > 0) {
                this.catalogueService.getBinaryObjects(imageUris_first).then(images => {
                    for (let image of images) {
                        for (let productUri in imageMap_first) {
                            if (imageMap_first[productUri] == image.uri) {
                                this.imageMap_first[productUri] = 'data:' + image.mimeCode + ';base64,' + image.value
                            }
                        }
                    }
                }, () => {
                });
            }
        } else {
            this.imageMap = {};

            let imageMap: any = {};
            for (let result of searchResults) {
                let productImages: string[] = result.imgageUri;
                if (productImages != null && productImages.length > 0) {
                    imageMap[result.uri] = productImages;
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
    }


    getName(name: string, prefix?: string) {
        // if it is a ubl property, then get its label from the ublProperties
        if (prefix) {
            name = prefix + '.' + name;
        }
        for (let ublProperty of this.ublProperties) {
            if (name == ublProperty.localName) {
                return selectNameFromLabelObject(ublProperty.label);
            }
        }
        // otherwise, use product_filter_mappings
        var ret = name;
        if (this.product_filter_mappings[name]) {
            ret = this.product_filter_mappings[name];
        }
        return ret;
    }

    onImageError(event){
        event.target.src = this.config.emptyImage;
    }

    private init(): void {

        if (this.firstSearch) {
            let len = this.itemTypeResponse_first.length;
            if (!this.initial) {
                this.collectionSize = this.itemTypeResponse_first.length;
            }
            this.catalogueLinesArray_first = [...this.itemTypeResponse_first];
            this.catalogueLinesWRTTypes_first = this.catalogueLinesArray_first;
            let i = 0;
            for (; i < len; i++) {
                this.catalogueLineView_first[this.itemTypeResponse_first[i].localName] = false;
            }
        } else {
            let len = this.itemTypeResponse.length;
            if (!this.initial) {
                this.collectionSize = this.itemTypeResponse.length;
            }
            this.catalogueLinesArray = [...this.itemTypeResponse];
            this.catalogueLinesWRTTypes = this.catalogueLinesArray;
            let i = 0;
            for (; i < len; i++) {
                this.catalogueLineView[this.itemTypeResponse[i].localName] = false;
            }
        }

    }

    onOpenCatalogueLine(e: Event) {
        e.stopImmediatePropagation();
    }

    getDeleteStatus(index: number): CallStatus {
        return this.deleteStatuses[index % this.pageSize];
    }

    viewCatalogueLine(cat: any) {
        this.catalogueService.getCatalogueLineByHjid(cat.localName).then(res => {
            this.catLineList[cat.localName] = res;
            this.userService.getSettingsForProduct(res).then(res2 => {
                this.catalogueLineView[cat.localName] = true;
                this.showDetails = true;
                this.comapanyList[cat.localName] = res2;
            });

        });
    }

    viewCatalogueLine_first(cat: any) {
        this.catalogueService.getCatalogueLineByHjid(cat.localName).then(res => {
            this.catLineList_first[cat.localName] = res;
            this.userService.getSettingsForProduct(res).then(res2 => {
                this.catalogueLineView_first[cat.localName] = true;
                this.showDetails_first = true;
                this.comapanyList_first[cat.localName] = res2;
            });

        });
    }

    findPrefItem(itemId: any): boolean {
        return this.favouriteItemIds.indexOf(itemId.toString()) !== -1;
    }

    removeFavorites(hjid: any) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
            let itemidList = [];
            itemidList.push(hjid.toString());
            this.addFavoriteCategoryStatus.submit();
            this.userService.putUserFavourite(itemidList, FAVOURITE_LINEITEM_PUT_OPTIONS[0].value).then(() => {
                var index = this.favouriteItemIds.indexOf(hjid.toString());
                if (index !== -1) {
                    this.favouriteItemIds.splice(index, 1);
                }
                this.findPrefItem(hjid);
                this.addFavoriteCategoryStatus.callback('Category removed from favorites', true);
            })
                .catch(error => {
                    this.addFavoriteCategoryStatus.error('Error while removing category from favorites', error);
                });
        }
    }

    addFavorites(hjid: any) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
            let itemidList = [];
            itemidList.push(hjid.toString());
            this.addFavoriteCategoryStatus.submit();
            this.userService.putUserFavourite(itemidList, FAVOURITE_LINEITEM_PUT_OPTIONS[0].value).then(() => {
                var index = this.favouriteItemIds.indexOf(hjid.toString());
                if (index == -1) {
                    this.favouriteItemIds.push(hjid.toString());
                }
                this.findPrefItem(hjid);
                this.addFavoriteCategoryStatus.callback('Category removed from favorites', true);
            })
                .catch(error => {
                    this.addFavoriteCategoryStatus.error('Error while removing category from favorites', error);
                });
        }
    }

}
