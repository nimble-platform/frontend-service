/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Category} from "../model/category/category";
import * as myGlobals from '../../globals';
import {Code} from "../model/publish/code";

@Injectable()
export class CategoryService {
    private headers = new Headers({'Accept': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint + `/catalogue/category`;

    selectedCategories: Category[] = [];

    constructor(private http: Http) {
    }

    getCategories(keyword: string): Promise<Category[]> {
        const url = `${this.baseUrl}?categoryName=${keyword}`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                return res.json() as Category[];
            })
            .catch(this.handleError);
    }

    getCategory(category: Category): Promise<Category> {
        const url = `${this.baseUrl}/` + category.taxonomyId + `?categoryId=` + encodeURIComponent(category.id);
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getCategoryByCode(code: Code): Promise<Category> {
        const url = `${this.baseUrl}/` + code.listID + "/" + encodeURIComponent(code.value);
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getMultipleCategories(codes: Code[]): Promise<Category[]> {
        let url = `${this.baseUrl}?ids=`;

        for (let code of codes) {
            url += code.listID + encodeURIComponent("," + code.value + ",");
        }

        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    addSelectedCategory(category: Category): void {
        // Only add if category is not null and doesn't exist in selected categories
        if (category != null && this.selectedCategories.findIndex(c => c.id == category.id) == -1) {
            this.selectedCategories.push(category);
        }
    }

    resetSelectedCategories():void {
        this.selectedCategories.length = 0;
    }

    resetData():void {
        this.resetSelectedCategories();
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}