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

import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Category } from "../model/category/category";
import * as myGlobals from '../../globals';
import { Code } from "../model/publish/code";
import { ParentCategories } from '../model/category/parent-categories';
import { sortCategories, getAuthorizedHeaders } from '../../common/utils';
import { CookieService } from "ng2-cookies";

@Injectable()
export class CategoryService {
    private baseUrl = myGlobals.catalogue_endpoint;
    private indexingBaseUrl = myGlobals.indexing_service_endpoint;
    private serviceCategories: string[];
    selectedCategories: Category[] = [];

    constructor(private http: Http,
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

    addSelectedCategory(category: Category): void {
        // Only add if category is not null and doesn't exist in selected categories
        if (category != null && this.selectedCategories.findIndex(c => c.id == category.id) == -1) {
            this.selectedCategories.push(category);
            sortCategories(this.selectedCategories);
        }
    }

    getRootCategories(taxonomyId: string): Promise<Category[]> {
        const url = `${this.baseUrl}/taxonomies/${taxonomyId}/root-categories`;
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
                return res.json();
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

    resetSelectedCategories(): void {
        this.selectedCategories.splice(0, this.selectedCategories.length);
    }

    resetData(): void {
        this.resetSelectedCategories();
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
