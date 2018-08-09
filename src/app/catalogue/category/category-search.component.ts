/**
 * Created by suat on 12-May-17.
 */

import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Category} from "../model/category/category";
import {CategoryService} from "./category.service";
import {CookieService} from "ng2-cookies";
import {UserService} from "../../user-mgmt/user.service";
import {CatalogueService} from "../catalogue.service";
import {PublishService} from "../publish-and-aip.service";
import {ProductPublishComponent} from "../publish/product-publish.component";
import {UBLModelUtils} from "../model/ubl-model-utils";
import {CallStatus} from '../../common/call-status';
import {sanitizeDataTypeName} from '../../common/utils';
import {CategoryTreeComponent} from './category-tree.component';
import { ParentCategories } from "../model/category/parent-categories";
import { sortCategories } from "../../common/utils";
import { PropertyValueQualifier } from "../model/publish/property-value-qualifier";
import { Property } from "../model/category/property";
import { AppComponent } from "../../app.component";
type ProductType = "product" | "transportation";

@Component({
    selector: 'category-search',
    templateUrl: './category-search.component.html',
    styleUrls: ['./category-search.component.css']
})

export class CategorySearchComponent implements OnInit {
    getCategoryStatus: CallStatus = new CallStatus();

    categories: Category[];
    pageRef: string = null;
    publishingGranularity: string;

    submitted: boolean = false;
    callback: boolean = false;
    error_detc: boolean = false;
    navigating: boolean = false;

    // It checks whether user will return publishing page or not
    isReturnPublish: boolean = false;
    // It checks whether user is publishing or not
    inPublish: boolean = false;

    // keeps the query term
    categoryKeyword: string;

    treeView: boolean = true;
    parentCategories: ParentCategories = null;
    rootCategories: Category[];

    selectedCategory: Category = null;
    selectedCategories: Category[] = [];
    selectedCategoryWithDetails: Category = null;
    selectedCategoriesWRTLevels = [];
    propertyNames: string[] = ["code", "taxonomyId", "level", "definition", "note", "remark"];
    taxonomyId: string = "eClass";
    prefCats: string[] = [];

    isLogistics: boolean;
    eClassLogisticsCategory: Category = null;

    showOtherProperties = null;
    callStatus: CallStatus = new CallStatus();
    productType: ProductType;

    favSelected: boolean;

    constructor(private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService,
                private userService: UserService,
                public categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private publishService:PublishService,
                public appComponent: AppComponent) {
    }


    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {

            // current page regs considered: menu, publish, null
            this.pageRef = params['pageRef'];

            //set product type
            this.productType = params["productType"] === "transportation" ? "transportation" : "product";
            this.isLogistics = (this.productType === "transportation");

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
                this.selectedCategory = null;
                this.selectedCategoryWithDetails = null;
                // reset draft catalogue line
                this.publishService.publishingStarted = false;
                this.publishService.publishMode = 'create';
            }

            this.prefCats = [];
            this.getPrefCat();

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
        this.getRootCategories();
    }

    getPrefCat() {
      let userId = this.cookieService.get('user_id');
      this.userService.getPrefCat(userId).then(res => {
        var prefCats_tmp = [];
        for (var i=0; i<res.length; i++) {
          if (res[i].split("::")[3] == this.productType)
            prefCats_tmp.push(res[i]);
        }
        prefCats_tmp.sort((a,b) => a.split("::")[2].localeCompare(b.split("::")[2]));
        this.prefCats = prefCats_tmp;
      });
    }

    findPrefCat(cat:Category):boolean {
      var cat_str = cat.id+"::"+cat.taxonomyId+"::"+cat.preferredName+"::"+this.productType;
      var found = false;
      if (this.prefCats.indexOf(cat_str) != -1)
        found = true;
      return found;
    }

    removeCat(cat:Category) {
      if (confirm("Are you sure that you want to remove this category from your favorites?")) {
        var cat_str = cat.id+"::"+cat.taxonomyId+"::"+cat.preferredName+"::"+this.productType;
        let userId = this.cookieService.get('user_id');
        this.userService.togglePrefCat(userId,cat_str).then(res => {
          var prefCats_tmp = [];
          for (var i=0; i<res.length; i++) {
            if (res[i].split("::")[3] == this.productType)
              prefCats_tmp.push(res[i]);
          }
          prefCats_tmp.sort((a,b) => a.split("::")[2].localeCompare(b.split("::")[2]));
          this.prefCats = prefCats_tmp;
        });
      }
    }

    addCat(cat:Category) {
      var cat_str = cat.id+"::"+cat.taxonomyId+"::"+cat.preferredName+"::"+this.productType;
      let userId = this.cookieService.get('user_id');
      this.userService.togglePrefCat(userId,cat_str).then(res => {
        var prefCats_tmp = [];
        for (var i=0; i<res.length; i++) {
          if (res[i].split("::")[3] == this.productType)
            prefCats_tmp.push(res[i]);
        }
        prefCats_tmp.sort((a,b) => a.split("::")[2].localeCompare(b.split("::")[2]));
        this.prefCats = prefCats_tmp;
      });
    }

    canDeactivate():boolean{

        this.inPublish = false;
        if(this.pageRef == "publish" && this.isReturnPublish == false){
            if(!confirm("You will lose any changes you made, are you sure you want to quit ?")){
                return false;
            }
        }
        return true;
    }

    onSearchCategory(): void {
        this.parentCategories = null;
        this.selectedCategoryWithDetails=null;
        this.treeView = false;
        this.router.navigate(['/catalogue/categorysearch'], {queryParams: {pg: this.publishingGranularity, pageRef: this.pageRef, cat: this.categoryKeyword, productType: this.productType}});
    }

    toggleTreeView(): void {
        this.treeView = !this.treeView;
    }

    getRootCategories(): any {
        this.callback = false;
        this.submitted = true;
        this.error_detc = false;
        this.getCategoryStatus.submit();
        this.categoryService.getRootCategories(this.taxonomyId).then(rootCategories => {
            this.rootCategories = sortCategories(rootCategories);
            this.getCategoryStatus.callback("Retrieved category details", true);
            this.eClassLogisticsCategory = this.rootCategories.find(c=> c.code==="14000000");
            let searchIndex = this.findCategoryInArray(this.rootCategories, this.eClassLogisticsCategory);
            this.rootCategories.splice(searchIndex, 1);
            this.callback = true;
            this.submitted = false;
        }).catch(error => {
            this.getCategoryStatus.error("Failed to retrieve category details");
            this.error_detc = true;
        });
    }

    displayRootCategories(taxonomyId: string): void {
        this.treeView = true;
        this.taxonomyId = taxonomyId;
        this.getRootCategories();
    }

    private getCategories(): void {

        this.callback = false;
        this.submitted = true;
        this.error_detc = false;

        this.categoryService.getCategoriesByName(this.categoryKeyword, this.isLogistics)
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
        // if no category is selected or if the selected category is already selected
        // do nothing
        if (category == null || this.findCategoryInArray(this.categoryService.selectedCategories, category) > -1) {
            return;
        }

        this.callback = false;
        this.submitted = true;
        this.error_detc = false;

        if(this.selectedCategoryWithDetails && category && this.selectedCategoryWithDetails.id == category.id){
            this.categoryService.addSelectedCategory(category);
            this.selectedCategories.push(category);
            this.callback = true;
            this.submitted = false;
            return;
        }

        this.categoryService.getCategory(category)
            .then(category => {
                this.categoryService.addSelectedCategory(category);
                this.selectedCategories.push(category);
                this.callback = true;
                this.submitted = false;
                return;
            }).catch( () => {
                this.error_detc = true;
            }
        );
    }

    private navigateToPublishingPage():void {
        this.navigating = true;
        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {
            ProductPublishComponent.dialogBox = true;
            // set isReturnPublish in order not to show confirmation popup
            this.isReturnPublish = true;
            this.router.navigate(['catalogue/publish'], {queryParams: {pg: this.publishingGranularity, productType: this.productType}});
        }).catch(() => {
            this.navigating = false;
            this.error_detc = true;
        });
    }

    private removeCategory(category: Category): void {
        let index = this.findCategoryInArray(this.categoryService.selectedCategories, category);
        if (index > -1) {
            this.categoryService.selectedCategories.splice(index, 1);
            let searchIndex = this.findCategoryInArray(this.selectedCategories, category);
            if(searchIndex > -1) {
                this.selectedCategories.splice(searchIndex, 1);
            }
        }
    }

    getCategoryTree(category: Category){
        this.selectedCategoryWithDetails = null;
        this.treeView = true;
        this.taxonomyId = category.taxonomyId;
        this.callStatus.submit();
        this.categoryService.getParentCategories(category).then(categories => {

            this.categoryService.getCategory(category)
                .then(category => {
                    this.rootCategories = sortCategories(categories.categories[0]);
                    this.selectedCategoryWithDetails = category;
                    this.selectedCategory = category;
                    this.parentCategories = categories; // parents categories
                    this.selectedCategoriesWRTLevels = [];
                    for(let parent of this.parentCategories.parents){
                        this.selectedCategoriesWRTLevels.push(parent.code);
                    }
                    this.callStatus.callback( null);
                }).catch( err => {
                    this.callStatus.error(null)
                }
            );

        })
            .catch(res=>
                this.callStatus.error(null)
            );
    }

    showPrefDetails(cat: string) {
      var cat_split = cat.split("::");
      var catFull: Category = {
        "id": cat_split[0],
        "preferredName": cat_split[2],
        "code": "",
        "level": 0,
        "definition": "",
        "note": "",
        "remark": "",
        "properties": [],
        "keywords": [],
        "taxonomyId": cat_split[1],
        "categoryUri": ""
      }
      this.getCategoryDetails(catFull,true);
    }

    isPrefSelected(cat:string): boolean {
      if(this.selectedCategory != null && this.favSelected == true) {
          return cat.split("::")[0] === this.selectedCategory.id;
      }
      return false;
    }

    getCategoryDetails(category: Category,fav:boolean) {
        this.favSelected = fav;
        this.callback = false;
        this.submitted = true;
        this.error_detc = false;
        this.selectedCategory = category;
        this.selectedCategoryWithDetails = null;
        this.callStatus.submit();

        this.showOtherProperties = false;
        this.categoryService.getCategory(category)
            .then(category => {
                this.callStatus.callback( "Retrieved details of the category",true);
                this.selectedCategoryWithDetails = category;
                this.callback = true;
                this.submitted = false;
            }).catch( err => {
                this.callStatus.error("Failed to retrieved details of the category");
                this.error_detc = true;
            }
        );
    }

    getCategoryProperty(propName): string {
        return String(this.selectedCategoryWithDetails[propName]);
    }

    getPropertyType(property: Property): string {
        return sanitizeDataTypeName(property.dataType);
    }

    private findCategoryInArray(categoryArray: Category[], category: Category): number {
        return categoryArray.findIndex(c => c.id == category.id);
    }
}
