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
    editCatalogueLine: boolean;
    submitted: boolean = false;
    callback: boolean = false;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private categoryService: CategoryService) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            this.startPublishingFromScratch = params['fromScratch'] == 'true';
            this.editCatalogueLine = params['edit'] == 'true';

            if(this.startPublishingFromScratch) {
                this.categoryService.resetSelectedCategories();
            }
            else if (this.editCatalogueLine) {

            }
        });
    }

    private getCategories(keyword: string): void {
        this.categoryService.getCategories(keyword)
            .then(categories => {
                this.categories = categories;
                this.callback = true;
                this.submitted = false;
            });
    }

    private selectCategory(category: Category): void {
        /* check if the property exists already, if so, do not add */
        if (category == null || this.categoryService.getSelectedCategories().findIndex(c => c.id == category.id) > -1) {
            this.router.navigate(['publish'], {queryParams: {fromScratch: this.startPublishingFromScratch}});
            return;
        }
        this.categoryService.getCategory(category)
            .then(category => {
                this.categoryService.addSelectedCategory(category);
                this.router.navigate(['publish'], {queryParams: {fromScratch: this.startPublishingFromScratch,
                    edit: this.editCatalogueLine}})
            });
    }
}
