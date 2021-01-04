/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { Category } from "../model/category/category";
import { CategoryService } from "./category.service";
import { CookieService } from "ng2-cookies";
import { UserService } from "../../user-mgmt/user.service";
import { PublishService } from "../publish-and-aip.service";
import { CallStatus } from "../../common/call-status";
import {findCategoryInArray, sanitizeDataTypeName, selectPreferredName, selectPreferredValues} from '../../common/utils';
import { ParentCategories } from "../model/category/parent-categories";
import { sortCategories, scrollToDiv } from "../../common/utils";
import { Property } from "../model/category/property";
import * as myGlobals from '../../globals';
import { AppComponent } from "../../app.component";
import { Text } from '../model/publish/text';
import { Observable } from "rxjs/Observable";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { SimpleSearchService } from "../../simple-search/simple-search.service";

const productType = "product";
type SelectedTab = "TREE"
    | "FAVORITE"
    | "RECENT";

@Component({
    selector: "category-search",
    templateUrl: "./category-search.component.html",
    styleUrls: ["./category-search.component.css"]
})
export class CategorySearchComponent implements OnInit {
    // whether the categories are selected for the publishing
    @Input() categoriesSelected:boolean = false;
    @Output() onCategoryRemoved = new EventEmitter<string>();
    selectedTab: SelectedTab = "TREE";

    getCategoriesStatus: CallStatus = new CallStatus();
    favoriteCategoriesStatus: CallStatus = new CallStatus();
    recentCategoriesStatus: CallStatus = new CallStatus();
    addFavoriteCategoryStatus: CallStatus = new CallStatus();
    getCategoryDetailsStatus: CallStatus = new CallStatus();

    categories: Category[];
    /*
    query parameters
     */
    // indicates whether only one category can be selected or multiple categories can be selected
    @Input() categoryCount: 'single' | 'multiple' = 'multiple';

    // keeps the query term
    categoryKeyword: string;

    treeView: boolean = true;
    parentCategories: ParentCategories = null;
    rootCategories: Category[];

    selectedCategory: Category = null;
    selectedCategoryWithDetails: Category = null;
    selectedCategoriesWRTLevels = [];
    propertyNames: string[] = ["code", "taxonomyId", "level", "definition", "note", "remark"];
    taxonomyId: string = myGlobals.config.standardTaxonomy;
    categoryFilter = myGlobals.config.categoryFilter;
    taxonomyIDs: string[];
    prefCats: string[] = [];
    recCats: string[] = [];
    showOtherProperties = null;

    favSelected: boolean;

    scrollToDivId = null;
    // stores the parents of the selected category. We need this since changing parentCategories in tree view results in some problems.
    pathToSelectedCategories:ParentCategories = null;

    findCategoryInArray = findCategoryInArray;
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cookieService: CookieService,
        private userService: UserService,
        public categoryService: CategoryService,
        private simpleSearchService: SimpleSearchService,
        private publishService: PublishService,
        public appComponent: AppComponent
    ) {
    }

    ngOnInit(): void {
        this.initCategories();
        // get available taxonomy ids
        this.categoryService.getAvailableTaxonomies().then(taxonomyIDs => {
            this.taxonomyIDs = ["All"];
            for (let i = 0; i < taxonomyIDs.length; i++) {
                this.taxonomyIDs.push(taxonomyIDs[i]);
            }
            this.getRootCategories();
        });
    }

    /**
     * Disables/Enables the category selection for the category based on the previously selected ones
     * */
    disableCategorySelection(){
        // if there are some selected categories, enable the selection iff the type of category (i.e, Product or Service) is the same with the others
        if(this.categoryService.selectedCategories.length !== 0){
            let isServiceCategory = this.categoryService.isServiceCategory(this.pathToSelectedCategories.parents);

            return !((this.categoryService.hasServiceCategories && isServiceCategory) || (!this.categoryService.hasServiceCategories && !isServiceCategory));
        }
        // if no category is selected, enable the selection
        return false;
    }

    initCategories(categoryKeyword:string = null){
        if (!this.categoriesSelected) {
            // reset categories
            this.categoryService.resetSelectedCategories();
            this.selectedCategory = null;
            this.selectedCategoryWithDetails = null;
            this.pathToSelectedCategories = null;
            // reset draft catalogue line
            this.publishService.resetData();
        }

        // get the favorite categories
        this.getFavoriteCategories();

        // get the recently used categories
        this.getRecentCategories();

        // handle category query term
        this.categoryKeyword = categoryKeyword;
        if (this.categoryKeyword != null) {
            this.getCategories();
        }
    }

    onSelectTab(event: any, id: any) {
        event.preventDefault();
        if (!this.getCategoryDetailsStatus.isDisplayed())
            this.selectedTab = id;
    }

    private getFavoriteCategories() {
        this.prefCats = [];
        this.favoriteCategoriesStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.userService.getPrefCat(userId).then(res => {
            var prefCats_tmp = [];
            for (var i = 0; i < res.length; i++) {
                if (res[i].split("::")[3] == productType) prefCats_tmp.push(res[i]);
            }
            prefCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
            this.prefCats = prefCats_tmp;
            this.favoriteCategoriesStatus.callback("Succesfully fetched favorite categories", true);
        })
            .catch(error => {
                this.favoriteCategoriesStatus.error("Error while fetching favorite categories.", error);
            });
    }

    private getRecentCategories() {
        this.recCats = [];
        this.recentCategoriesStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.userService.getRecCat(userId).then(res => {
            var recCats_tmp = [];
            for (var i = 0; i < res.length; i++) {
                if (res[i].split("::")[3] == productType) recCats_tmp.push(res[i]);
            }
            recCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
            this.recCats = recCats_tmp;
            this.recentCategoriesStatus.callback("Succesfully fetched recent categories", true);
        })
            .catch(error => {
                this.recentCategoriesStatus.error("Error while fetching favorite categories.", error);
            });
    }

    findPrefCat(cat: Category): boolean {
        var cat_str = cat.id + "::" + cat.taxonomyId + "::" + selectPreferredName(cat) + "::" + productType;
        var found = false;
        if (this.prefCats.indexOf(cat_str) != -1) found = true;
        return found;
    }

    removeCategoryFromFavorites(cat: Category) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
            this.addFavoriteCategoryStatus.submit();
            const cat_str = cat.id + "::" + cat.taxonomyId + "::" + selectPreferredName(cat) + "::" + productType;
            const userId = this.cookieService.get("user_id");
            this.userService.togglePrefCat(userId, cat_str).then(res => {
                const prefCats_tmp = [];
                for (var i = 0; i < res.length; i++) {
                    if (res[i].split("::")[3] == productType) prefCats_tmp.push(res[i]);
                }
                prefCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
                this.prefCats = prefCats_tmp;
                this.addFavoriteCategoryStatus.callback("Category removed from favorites", true);
            })
                .catch(error => {
                    this.addFavoriteCategoryStatus.error("Error while removing category from favorites", error);
                });
        }
    }

    addCategoryToFavorites(cat: Category) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
            this.addFavoriteCategoryStatus.submit();
            const cat_str = cat.id + "::" + cat.taxonomyId + "::" + selectPreferredName(cat) + "::" + productType;
            const userId = this.cookieService.get("user_id");
            this.userService.togglePrefCat(userId, cat_str).then(res => {
                const prefCats_tmp = [];
                for (var i = 0; i < res.length; i++) {
                    if (res[i].split("::")[3] == productType) prefCats_tmp.push(res[i]);
                }
                prefCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
                this.prefCats = prefCats_tmp;
                this.addFavoriteCategoryStatus.callback("Category added to favorites", true);
            })
                .catch(error => {
                    this.addFavoriteCategoryStatus.error("Error while adding category to favorites", error);
                });
        }
    }

    selectPreferredName(cp: Category | Property) {
        return selectPreferredName(cp);
    }

    isDefinitionOrRemarkAvailable(property: Property): boolean {
        return (property.definition != null && property.definition.trim().length > 0) || (property.remark != null && property.remark.length > 0);
    }

    getPropertyDefinitionOrRemark(property: Property): string {
        if (property.definition != null && property.definition.trim().length > 0) {
            return property.definition;
        }
        if (property.remark != null && property.remark.length > 0) {
            return selectPreferredValues(property.remark)[0];
        }
        return "";
    }

    onSearchCategory(): void {
        this.parentCategories = null;
        this.pathToSelectedCategories = null;
        this.selectedCategoryWithDetails = null;
        this.treeView = false;
        this.initCategories(this.categoryKeyword)
    }

    toggleTreeView(): void {
        this.treeView = !this.treeView;
    }

    private getRootCategories(): any {
        this.getCategoriesStatus.aggregatedSubmit();
        let taxonomyIds = this.taxonomyId == "All" ? Object.keys(this.categoryFilter) : [this.taxonomyId];
        this.categoryService
            .getRootCategories(taxonomyIds)
            .then(rootCategories => {
                this.rootCategories = sortCategories(rootCategories);
                this.getCategoriesStatus.aggregatedCallBack("Retrieved category details", true);
                for(let taxonomyId of taxonomyIds){
                    let logisticsCategory = this.rootCategories.find(c => c.code === this.categoryFilter[taxonomyId].logisticsCategory);
                    if (logisticsCategory != null) {
                        let searchIndex = findCategoryInArray(this.rootCategories, logisticsCategory);
                        this.rootCategories.splice(searchIndex, 1);
                    }
                    for (var i = 0; i < this.categoryFilter[taxonomyId].hiddenCategories.length; i++) {
                        let filterCat = this.rootCategories.find(c => c.code === this.categoryFilter[taxonomyId].hiddenCategories[i]);
                        if (filterCat != null) {
                            let searchIndex = findCategoryInArray(this.rootCategories, filterCat);
                            this.rootCategories.splice(searchIndex, 1);
                        }
                    }
                }
            })
            .catch(error => {
                this.getCategoriesStatus.aggregatedError("Failed to retrieve category details", error);
            });
    }

    getSuggestions = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(term =>
                this.simpleSearchService.getClassSuggestions(term, ("{LANG}_label"), this.taxonomyId == "All" ? "" : this.categoryFilter[this.taxonomyId].ontologyPrefix)
            )
        );

    private getCategories(): void {
        this.getCategoriesStatus.aggregatedSubmit();
        this.categoryService
            .getCategoriesByName(this.categoryKeyword, this.taxonomyId, false)
            .then(categories => {
                this.parentCategories = null;
                this.pathToSelectedCategories = null;
                this.categories = categories;
                this.getCategoriesStatus.aggregatedCallBack("Successfully got search results", true);
            })
            .catch(error => {
                this.getCategoriesStatus.aggregatedError("Error while searching for categories", error);
            });
    }

    addCategoryToSelected(category: Category): void {
        if (this.categoryCount === 'multiple') {
            // if no category is selected or if the selected category is already selected
            // do nothing
            if (category == null || findCategoryInArray(this.categoryService.selectedCategories, category) > -1) {
                return;
            }

            if (this.selectedCategoryWithDetails !== category) {
                throw new Error("Inconsistent state: can only select the details category.");
            }
        } else {
            // if single category is allowed, clear the already selected category
            this.categoryService.selectedCategories = [];
        }

        this.categoryService.addSelectedCategory(category,this.pathToSelectedCategories.parents);
    }

    getCategoryTree(category: Category, scrollToDivId = null) {
        this.selectedCategoryWithDetails = null;
        this.treeView = true;
        this.taxonomyId = category.taxonomyId;
        this.getCategoriesStatus.aggregatedSubmit();
        this.categoryService
            .getParentCategories(category)
            .then(categories => {
                this.categoryService
                    .getCategory(category)
                    .then(category => {
                        this.rootCategories = sortCategories(categories.categories[0]);
                        if (!scrollToDivId) {
                            this.scrollToDivId = category.code;
                        }
                        else {
                            this.scrollToDivId = scrollToDivId;
                        }
                        this.selectedCategoryWithDetails = category;
                        this.selectedCategory = category;
                        this.parentCategories = categories; // parents categories
                        this.pathToSelectedCategories = this.parentCategories;
                        this.selectedCategoriesWRTLevels = [];
                        for (let parent of this.parentCategories.parents) {
                            this.selectedCategoriesWRTLevels.push(parent.code);
                        }
                        this.getCategoriesStatus.aggregatedCallBack(null, true);
                        if (this.treeView) {
                            setTimeout(function() {
                                scrollToDiv(category.code);
                                document.getElementById("scrollDiv").scrollTop -= 57;
                            }, 100);
                        }
                    })
                    .catch(error => {
                        this.getCategoriesStatus.aggregatedError("Error while fetching category.", error);
                    });
            })
            .catch(error => {
                this.getCategoriesStatus.aggregatedError("Error while fetching parrent category.", error);
            });
    }

    showAdDetails(cat: string) {
        var cat_split = cat.split("::");
        var catFull: Category = {
            id: cat_split[0],
            preferredName: [new Text(cat_split[2])],
            code: "",
            level: 0,
            definition: [],
            note: "",
            remark: "",
            properties: [],
            keywords: [],
            taxonomyId: cat_split[1],
            categoryUri: ""
        };
        this.getCategoryDetails(catFull, true);
    }

    isAdSelected(cat: string): boolean {
        if (this.selectedCategory != null && this.favSelected == true) {
            return cat.split("::")[0] === this.selectedCategory.id;
        }
        return false;
    }

    getCategoryDetails(category: Category, fav: boolean) {
        if (!this.getCategoryDetailsStatus.isDisplayed()) {
            if (!this.selectedCategory || (this.selectedCategory && this.selectedCategory.id !== category.id)) {
                this.favSelected = fav;
                this.selectedCategory = category;
                this.selectedCategoryWithDetails = null;
                this.getCategoryDetailsStatus.submit();

                this.showOtherProperties = false;
                this.categoryService
                    .getCategory(category)
                    .then(category => {
                        this.categoryService.getParentCategories(category).then(parentCategories => {
                            this.pathToSelectedCategories = parentCategories;
                            this.getCategoryDetailsStatus.callback("Retrieved details of the category", true);
                            this.selectedCategoryWithDetails = category;
                            if (this.treeView) {
                                setTimeout(function() {
                                    scrollToDiv(category.code);
                                    document.getElementById("scrollDiv").scrollTop -= 57;
                                }, 100);
                            }
                        }).catch(error => {
                            this.getCategoryDetailsStatus.error("Failed to retrieved parents of the category", error);
                        })

                    })
                    .catch(error => {
                        this.getCategoryDetailsStatus.error("Failed to retrieved details of the category", error);
                    });
            }
        }
    }

    getCategoryProperty(propName): string {
        // Type of the definition field is Text[]. Therefore, we have to use selectPreferredValues method
        // to get proper value of this category property
        if (propName == "definition") {
            return selectPreferredValues(this.selectedCategoryWithDetails[propName])[0];
        }
        return String(this.selectedCategoryWithDetails[propName]);
    }

    getPropertyType(property: Property): string {
        return sanitizeDataTypeName(property.dataType);
    }

    private changeTaxonomyId(taxonomyId) {
        if (this.taxonomyId != taxonomyId) {
            this.parentCategories = null;
            this.pathToSelectedCategories = null;
            this.selectedCategory = null;
            this.selectedCategoryWithDetails = null;
            this.taxonomyId = taxonomyId;
            if (this.categoryKeyword) {
                this.getCategories();
            }
            if (this.selectedTab == "TREE") {
                this.getRootCategories();
            }
        }
    }

    private scrollToDiv(divId: string) {
        //this.scrollToDivId = divId;
        // if treeView is false,firstly we have to switch to tree view
        if (!this.getCategoryDetailsStatus.isDisplayed()) {
            if (!this.treeView) {
                this.getCategoryTree(this.selectedCategoryWithDetails, divId);
            }
            else {
                scrollToDiv(divId);
                document.getElementById("scrollDiv").scrollTop -= 57;
            }
        }
    }

    public removeSelectedCategory(selectedCategory:Category){
        this.categoryService.removeSelectedCategory(selectedCategory);
        this.onCategoryRemoved.next(selectedCategory.id);
    }
}
