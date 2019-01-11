/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Category} from "../model/category/category";
import * as myGlobals from '../../globals';
import {Code} from "../model/publish/code";
import { ParentCategories } from '../model/category/parent-categories';
import { sortCategories, getAuthorizedHeaders } from '../../common/utils';
import {CookieService} from "ng2-cookies";

@Injectable()
export class CategoryService {
    private baseUrl = myGlobals.catalogue_endpoint + `/catalogue/category`;

    selectedCategories: Category[] = [];

    constructor(private http: Http,
                private cookieService: CookieService) {
    }

    getCategoriesByName(keyword: string, taxonomyId: string,isLogistics: boolean): Promise<Category[]> {
        const url = `${myGlobals.catalogue_endpoint}/catalogue/taxonomies/${taxonomyId}?name=${keyword}&forLogistics=${isLogistics}`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json() as Category[];
            })
            .catch(this.handleError);
    }

    getCategoriesByIds(codes: Code[]): Promise<Category[]> {
        if(!codes) {
            return Promise.resolve([]);
        }

        let customCategoryCodes: Code[] = [];
        let customCategories: Category[] = [];
        let categories:Category[] = [];

        // remove default category
        codes = codes.filter(function (cat) {
            return cat.listID != 'Default';
        });

        customCategoryCodes = codes.filter(function (cat) {
           return cat.listID == 'Custom';
        });

        // get non-custom categories
        codes = codes.filter(function (cat) {
           return cat.listID != 'Custom';
        });

        if(codes.length > 0){
            let url = this.baseUrl;
            let categoryIds:string = '';
            let taxonomyIds:string = '';

            let i = 0;
            for (; i<codes.length-1; i++) {
                categoryIds += encodeURIComponent(codes[i].value) + ",";
                taxonomyIds += codes[i].listID + ",";
            }
            categoryIds += encodeURIComponent(codes[i].value);
            taxonomyIds += codes[i].listID;

            url += "?taxonomyIds=" + taxonomyIds + "&categoryIds=" + categoryIds;

            return this.http
                .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
                .toPromise()
                .then(res => {
                    categories = categories.concat(res.json() as Category[]);
                    return categories;
                })
                .catch(this.handleError);
        }
        else{
            return Promise.resolve(categories);
        }
    }

    getCategory(category: Category): Promise<Category> {
        const url = `${this.baseUrl}?taxonomyIds=` + category.taxonomyId + `&categoryIds=` + encodeURIComponent(category.id);
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json()[0] as Category;
            })
            .catch(this.handleError);
    }

    getCategoryByCode(code: Code): Promise<Category> {
        const url = `${this.baseUrl}/` + code.listID + "/" + encodeURIComponent(code.value);
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getParentCategories(category: Category): Promise<ParentCategories>{
        const url = `${this.baseUrl}/tree?taxonomyId=${category.taxonomyId}&categoryId=${encodeURIComponent(category.id)}`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
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

    getRootCategories(taxonomyId: string): Promise<Category[]>{
        const url = `${this.baseUrl}/${taxonomyId}/root-categories`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getChildrenCategories(category: Category): Promise<Category[]>{
        const url = `${this.baseUrl}/children-categories?taxonomyId=${category.taxonomyId}&categoryId=${encodeURIComponent(category.id)}`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getAvailableTaxonomies(){
        const url = `${this.baseUrl}/taxonomies`;
        return this.http
            .get(url, {headers: getAuthorizedHeaders(this.cookieService)})
            .toPromise()
            .then(res => {
                return res.json();
            })
            .catch(this.handleError);
    }

    resetSelectedCategories():void {
        this.selectedCategories.splice(0, this.selectedCategories.length);
    }

    resetData():void {
        this.resetSelectedCategories();
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
