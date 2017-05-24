/**
 * Created by suat on 12-May-17.
 */

import {Headers, Http} from "@angular/http";
import {Component} from "@angular/core";
import {Router} from '@angular/router';
import {Category} from "../model/category/category";
import * as myGlobals from '../../globals';
import {CategoryService} from "./category.service";

@Component({
    selector: 'category-search',
    templateUrl: './category-search.component.html',
})

export class CategorySearchComponent {
    private headers = new Headers({'Accept': 'application/json'});
    // TODO remove the hardcoded URL
    //private url = myGlobals.endpoint;
    private url = `http://localhost:8095/catalogue/category`;
    categories: Category[];

    constructor(private http: Http,
                private router: Router,
                private categoryService: CategoryService) {
    }

    private getCategories(keyword: string): void {
        this.categoryService.getCategories(keyword)
            .then(categories => {
                this.categories = categories;
            });
    }

    private selectCategory(category: Category): void {
        if(category == null) {
            this.router.navigate(['publish']);
        }
        this.categoryService.getCategory(category.id)
            .then(category => {
                this.categoryService.setSelectedCategory(category);
                this.router.navigate(['publish'])
            });
    }
}
