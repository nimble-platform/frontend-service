/**
 * Created by suat on 12-May-17.
 */

import {Http} from "@angular/http";
import {Component} from "@angular/core";
import {Router} from '@angular/router';
import {Category} from "../model/category/category";
import {CategoryService} from "./category.service";

@Component({
    selector: 'category-search',
    templateUrl: './category-search.component.html',
})

export class CategorySearchComponent {
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
        if (category == null) {
            this.router.navigate(['publish']);
            return;
        }
        this.categoryService.getCategory(category.id)
            .then(category => {
                this.categoryService.setSelectedCategory(category);
                this.router.navigate(['publish'])
            });
    }
}
