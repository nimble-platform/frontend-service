/**
 * Created by suat on 12-May-17.
 */

import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Category} from "../model/category/category";
import {CategoryService} from "./category.service";
import {CookieService} from "ng2-cookies";
import {CatalogueService} from "../catalogue.service";

@Component({
    selector: 'category-search',
    templateUrl: './category-search.component.html',
})

export class CategorySearchComponent implements OnInit {
    categories: Category[];
    pageRef: string;

    submitted: boolean = false;
    callback: boolean = false;
    error_detc: boolean = false;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService,
                private categoryService: CategoryService,
                private catalogueService: CatalogueService) {
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            this.pageRef = params['pageRef'];

            if(this.pageRef == 'menu') {
                this.categoryService.resetSelectedCategories();
            } else if (this.pageRef == 'publish') {

            }
        });
    }

    private getCategories(keyword: string): void {

        if (keyword.length < 1)
            return;

        this.callback = false;
        this.submitted = true;
        this.error_detc = false;

        this.categoryService.getCategoriesByName(keyword)
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
        if (category == null || this.categoryService.selectedCategories.findIndex(c => c.id == category.id) > -1) {
            this.navigateToPublishingPage();
            return;
        }

        this.categoryService.getCategory(category)
            .then(category => {
                this.categoryService.addSelectedCategory(category);
                this.navigateToPublishingPage();
            });
    }

    private navigateToPublishingPage():void {
        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {
            this.router.navigate(['publish'], {queryParams: {pageRef: "category"}});
        });
    }
}
