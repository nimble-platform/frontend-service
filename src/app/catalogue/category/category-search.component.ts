/**
 * Created by suat on 12-May-17.
 */

import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Category} from "../model/category/category";
import {CategoryService} from "./category.service";
import {CookieService} from "ng2-cookies";
import {CatalogueService} from "../catalogue.service";
import {PublishService} from "../publish-and-aip.service";
import {ProductPublishComponent} from "../product-publish.component";
import {UBLModelUtils} from "../model/ubl-model-utils";

@Component({
    selector: 'category-search',
    templateUrl: './category-search.component.html',
})

export class CategorySearchComponent implements OnInit {
    categories: Category[];
    pageRef: string = null;
    publishingGranularity: string;

    submitted: boolean = false;
    callback: boolean = false;
    error_detc: boolean = false;

    // It checks whether user will return publishing page or not
    isReturnPublish: boolean = false;
    // It checks whether user is publishing or not
    inPublish: boolean = false;

    // whether customCategoryPage is displayed or not
    customCategoryPage: boolean = false;

    // keeps the query term
    categoryKeyword: string;
    // custom category name
    customCategory: string;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService,
                private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private publishService:PublishService) {
    }


    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {

            // current page regs considered: menu, publish, null
            this.pageRef = params['pageRef'];

            // This part is necessary since only the params has changes,canDeactivate method will not be called.
            if(this.inPublish == true && this.pageRef == 'menu'){
                if(!confirm("You will lose any changes you made, are you sure you want to quit ?")){
                    return;
                }
            }

            // If pageRef is 'publish',then user is publishing.
            if(this.pageRef == 'publish'){
                this.inPublish = true;
            }

            if(this.pageRef == null || this.pageRef == 'menu') {
                // reset categories
                this.categoryService.resetSelectedCategories();
                // reset draft catalogue line
                this.publishService.publishingStarted = false;
                this.publishService.publishMode = 'create';
            }

            // publishing granularity: single, bulk, null
            this.publishingGranularity = params['pg'];
            if(this.pageRef == null) {
                this.pageRef = 'single';
            }

            // handle category query term
            this.categoryKeyword = params['cat'];
            if(this.categoryKeyword != null) {
                this.getCategories();
            }
        });
    }

    canDeactivate():boolean{
        //
        this.inPublish = false;
        if(this.pageRef == "publish" && this.isReturnPublish == false){
            if(!confirm("You will lose any changes you made, are you sure you want to quit ?")){
                return false;
            }
        }
        return true;
    }

    onSearchCategory(): void {
        this.router.navigate(['/catalogue/categorysearch'], {queryParams: {pg: this.publishingGranularity, pageRef: this.pageRef, cat: this.categoryKeyword}});
    }

    private getCategories(): void {

        this.callback = false;
        this.submitted = true;
        this.error_detc = false;

        this.categoryService.getCategoriesByName(this.categoryKeyword)
            .then(categories => {
                this.categories = categories;
                this.callback = true;
                this.submitted = false;
            }).catch( () => {
                this.error_detc = true;
            }
        );
    }

    private selectCategory(category: Category): void {
        this.callback = false;
        this.submitted = true;
        this.error_detc = false;

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
            }).catch( () => {
                this.error_detc = true;
            }
        );
    }

    private addCustomCategory(text: string): void{
        this.categoryService.addSelectedCategory(new Category(text,text,null,null,null,null,null,[],[],'Custom',null));
        this.navigateToPublishingPage();
    }

    private navigateToPublishingPage():void {
        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {
            ProductPublishComponent.dialogBox = true;
            // set isReturnPublish in order not to show confirmation popup
            this.isReturnPublish = true;
            this.router.navigate(['catalogue/publish'], {queryParams: {pg: this.publishingGranularity}});
        }).catch(() => {
            this.error_detc = true;
        });
    }
}
