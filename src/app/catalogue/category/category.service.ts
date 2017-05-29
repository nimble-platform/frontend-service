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
    // TODO change the catalogue_endpoint with the common endpoint
    private baseUrl = myGlobals.catalogue_endpoint + `/catalogue/category`;
    private categories: Category[] = null;
    private selectedCategory: Category= null;

    constructor(private http: Http) {
    }

    getCategories(keyword: string): Promise<Category[]> {
        const url = `${this.baseUrl}?categoryName=${keyword}`;
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                this.categories = res.json() as Category[];
                return this.categories;
            })
            .catch(this.handleError);
    }

    getCategory(id: string): Promise<Category> {
        const url = `${this.baseUrl}/` + encodeURIComponent(id);
        return this.http
            .get(url, {headers: this.headers})
            .toPromise()
            .then(res => {
                return res.json() as Category;
            })
            .catch(this.handleError);
    }

    getSelectedCategory(): Category {
        return this.selectedCategory;
    }

    setSelectedCategory(category: Category): void {
        this.selectedCategory = category;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}