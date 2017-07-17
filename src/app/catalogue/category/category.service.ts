/**
 * Created by suat on 17-May-17.
 */
import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Category} from "../model/category/category";
import * as myGlobals from '../../globals';

@Injectable()
export class CategoryService {
    private headers = new Headers({'Accept': 'application/json'});
    private baseUrl = myGlobals.catalogue_endpoint + `/catalogue/category`;
    private selectedCategories: Category[] = [];

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
        const url = `${this.baseUrl}/` + category.taxonomyId + "/" + encodeURIComponent(category.id);
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getSelectedCategories(): Category[] {
        return this.selectedCategories;
    }

    addSelectedCategory(category: Category): void {
        this.selectedCategories.push(category);
    }

    resetSelectedCategories():void {
        this.selectedCategories = [];
    }

    resetData():void {
        this.resetSelectedCategories();
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}