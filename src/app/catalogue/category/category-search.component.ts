/**
 * Created by suat on 12-May-17.
 */

import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Category} from "../model/category/category";
import {CategoryService} from "./category.service";

@Component({
    selector: 'category-search',
    templateUrl: './category-search.component.html',
})

export class CategorySearchComponent implements OnInit {
    categories: Category[];
    startPublishingFromScratch: boolean;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private categoryService: CategoryService) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            this.startPublishingFromScratch = params['fromScratch'] == 'true';
            if(this.startPublishingFromScratch) {
                this.categoryService.resetSelectedCategories();
            }
        });
    }

    private getCategories(keyword: string): void {
        this.categoryService.getCategories(keyword)
            .then(categories => {
                this.categories = categories;
            });
    }

    private selectCategory(category: Category): void {
        if (category == null) {
            this.router.navigate(['publish'], {queryParams: {fromScratch: this.startPublishingFromScratch}});
            return;
        }
        this.categoryService.getCategory(category)
            .then(category => {
                this.categoryService.addSelectedCategory(category);
                this.router.navigate(['publish'], {queryParams: {fromScratch: this.startPublishingFromScratch}})
            });
    }
}
