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
    newPublishing: boolean;
    editCatalogueLine: boolean;

    submitted: boolean = false;
    callback: boolean = false;
    error_detc: boolean = false;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private categoryService: CategoryService) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            this.newPublishing = params['newPublishing'] == 'true';
            this.editCatalogueLine = params['edit'] == 'true';

            if(this.newPublishing) {
                this.categoryService.resetSelectedCategories();
            }
            else if (this.editCatalogueLine) {

            }
        });
    }

    private getCategories(keyword: string): void {

        if (keyword.length < 1)
            return;

        this.callback = false;
        this.submitted = true;
        this.error_detc = false;

        this.categoryService.getCategories(keyword)
            .then(categories => {
                this.categories = categories;
                this.callback = true;
                this.submitted = false;
            }).catch( () => {
                this.error_detc = true;
                console.log(this.error_detc);
            }
        );
    }

    private selectCategory(category: Category): void {
        // if no category is selected or if the selected category is already selected
        // navigate to the publishing page directly
        if (category == null || this.categoryService.getSelectedCategories().findIndex(c => c.id == category.id) > -1) {
            this.router.navigate(['publish'], {queryParams: {newPublishing: this.newPublishing}});
            return;
        }

        this.categoryService.getCategory(category)
            .then(category => {
                this.categoryService.addSelectedCategory(category);
                this.router.navigate(['publish'], {queryParams: {newPublishing: this.newPublishing,
                    edit: this.editCatalogueLine}})
            });
    }
}
