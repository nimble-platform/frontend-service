/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Category} from '../../common/model/category/category';
import * as myGlobals from '../../globals';
import {Code} from '../model/publish/code';
import {ParentCategories} from '../../common/model/category/parent-categories';
import {findCategoryInArray, getAuthorizedHeaders, selectPreferredName, sortCategories} from '../../common/utils';
import {CookieService} from 'ng2-cookies';
import {UserService} from '../../user-mgmt/user.service';

/**
 * This service manages the categories to be selected for the product publishing.
 * */
@Injectable()
export class CategoryService {
    private baseUrl = myGlobals.catalogue_endpoint;
    private indexingBaseUrl = myGlobals.indexing_service_endpoint;
    private serviceCategories: string[];
    // whether any service categories are selected
    hasServiceCategories:boolean = null;
    // keeps the list of selected categories
    selectedCategories: Category[] = [];
    categoryFilter = myGlobals.config.categoryFilter;

    constructor(private http: Http,
        private userService: UserService,
        private cookieService: CookieService) {
    }

    getCategoriesByName(keyword: string, taxonomyId: string, isLogistics: boolean): Promise<Category[]> {
        const url = `${this.baseUrl}/taxonomies/${taxonomyId}/categories?name=${keyword}&forLogistics=${isLogistics}`;
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                return res.json() as Category[];
            })
            .catch(this.handleError);
    }

    getCategoriesByIds(codes: Code[]): Promise<Category[]> {
        if (!codes) {
            return Promise.resolve([]);
        }

        let categories: Category[] = [];

        if (codes.length > 0) {
            let url = this.baseUrl;
            let categoryIds: string = '';
            let taxonomyIds: string = '';

            let i = 0;
            for (; i < codes.length - 1; i++) {
                categoryIds += encodeURIComponent(codes[i].value) + ",";
                taxonomyIds += codes[i].listID + ",";
            }
            categoryIds += encodeURIComponent(codes[i].value);
            taxonomyIds += codes[i].listID;

            url += "/categories?taxonomyIds=" + taxonomyIds + "&categoryIds=" + categoryIds;

            return this.http
                .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
                .toPromise()
                .then(res => {
                    categories = categories.concat(res.json() as Category[]);
                    return categories;
                })
                .catch(this.handleError);
        }
        else {
            return Promise.resolve(categories);
        }
    }

    /**
     * Gets labels for the categories specified with the uris. The result is a map of uri->label map.
     * @param uris
     */
    public getCategories(uris: string[]): Promise<any> {
        const url = this.indexingBaseUrl + "/class/search";
        let query = "";
        for (let uri of uris) {
            query += `id:"${uri}" OR `;
        }
        if (query != "")
            query = query.substring(0, query.length - 4);
        let searchObject: any = {};
        searchObject.rows = 99999;
        searchObject.q = query;
        return this.http
            .post(url, searchObject, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getCategory(category: Category): Promise<Category> {
        const url = `${this.baseUrl}/categories?taxonomyIds=` + category.taxonomyId + `&categoryIds=` + encodeURIComponent(category.id);
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                return res.json()[0] as Category;
            })
            .catch(this.handleError);
    }

    getCategoriesForIds(taxonomyIds: string[], categoryIds: string[]): Promise<Category[]> {
        // create the url
        const taxonomyIdSize = taxonomyIds.length;
        const categoryIdSize = categoryIds.length;

        let taxonomyIdsParam = "";
        let categoryIdsParam = "";

        taxonomyIds.forEach(function(value, index) {
            if (index === taxonomyIdSize - 1)
                taxonomyIdsParam += value;
            else
                taxonomyIdsParam += value + ",";
        });

        categoryIds.forEach(function(value, index) {
            if (index === categoryIdSize - 1)
                categoryIdsParam += value;
            else
                categoryIdsParam += value + ",";
        });

        const url = `${this.baseUrl}/categories?taxonomyIds=` + taxonomyIdsParam + `&categoryIds=` + encodeURIComponent(categoryIdsParam);
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);
    }

    getParentCategories(category: Category): Promise<ParentCategories> {
        const url = `${this.baseUrl}/taxonomies/${category.taxonomyId}/categories/tree?categoryId=${encodeURIComponent(category.id)}`;
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                return res.json() as ParentCategories;
            })
            .catch(this.handleError);
    }

    /**
     * Returns whether the category is a service category or not for the given root category uri
     * @return true if the root category is a service category, otherwise, returns false
     * @param rootCategoryUri
     * */
    isServiceCategory(rootCategoryUri:string){
        return this.serviceCategories.indexOf(rootCategoryUri) !== -1;
    }

    getRootCategories(taxonomyIds: string[]): Promise<Category[]> {
        const url = `${this.baseUrl}/taxonomies/root-categories?taxonomyIds=${taxonomyIds.join(',')}`;
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getChildrenCategories(category: Category): Promise<Category[]> {
        const url = `${this.baseUrl}/taxonomies/${category.taxonomyId}/categories/children-categories?categoryId=${encodeURIComponent(category.id)}`;
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getAvailableTaxonomies() {
        const url = `${this.baseUrl}/taxonomies/id`;
        return this.http
            .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
            .toPromise()
            .then(res => {
                let availableTaxonomies = res.json();
                // consider only the taxonomies specified in the globals.categoryFilter
                return availableTaxonomies.filter(taxonomyId => this.categoryFilter[taxonomyId]);
            })
            .catch(this.handleError);
    }

    async getServiceCategoriesForAvailableTaxonomies(): Promise<string[]> {
        if (this.serviceCategories != null) {
            return Promise.resolve(this.serviceCategories);
        }

        let availableTaxonomies: string[] = await this.getAvailableTaxonomies();
        let rootServiceCategoryPromises: Promise<void>[] = [];
        let result: string[] = [];
        for (let taxonomyId of availableTaxonomies) {
            let url = `${this.baseUrl}/taxonomies/${taxonomyId}/service-categories`;
            rootServiceCategoryPromises.push(this.http
                .get(url, { headers: getAuthorizedHeaders(this.cookieService) })
                .toPromise()
                .then(res => {
                    result.push(...res.json());
                }));
        }
        return Promise.all([...rootServiceCategoryPromises]).then(() => {
            this.serviceCategories = result;
            return this.serviceCategories;
        })
    }

    // methods to handle selected categories
    addSelectedCategory(category: Category): void {
        // Only add if category is not null and doesn't exist in selected categories
        if (category != null && this.selectedCategories.findIndex(c => c.id == category.id) == -1) {
            // check the first selected category is service or not
            if(this.selectedCategories.length == 0){
                this.hasServiceCategories = this.isServiceCategory(category.rootCategoryUri);
            }
            this.selectedCategories.push(category);
            sortCategories(this.selectedCategories);
        }
    }

    removeSelectedCategory(category: Category): void {
        let index = findCategoryInArray(this.selectedCategories, category);
        if (index > -1) {
            this.selectedCategories.splice(index, 1);
        }
        // if there is no selected categories, reset hasServiceCategories field
        if(this.selectedCategories.length == 0){
            this.hasServiceCategories = false;
        }
    }

    resetSelectedCategories(): void {
        this.selectedCategories.splice(0, this.selectedCategories.length);
        // since there is no selected categories, reset hasServiceCategories field
        this.hasServiceCategories = false;
    }
    // the end of methods to handle selected categories

    resetData(): void {
        this.resetSelectedCategories();
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

    public addRecentCategories(cat: Category[]) {
        var recCatPost = [];
        var timeStamp = new Date().getTime();
        for (var i = 0; i < cat.length; i++) {
            const cat_str = cat[i].id + "::" + cat[i].taxonomyId + "::" + selectPreferredName(cat[i]) + "::product::" + timeStamp;
            recCatPost.push(cat_str);
        }
        const userId = this.cookieService.get("user_id");
        this.userService.addRecCat(userId, recCatPost);
    }
}
