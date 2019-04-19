import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Category } from "../model/category/category";
import { CategoryService } from "./category.service";
import { CookieService } from "ng2-cookies";
import { UserService } from "../../user-mgmt/user.service";
import { CatalogueService } from "../catalogue.service";
import { PublishService } from "../publish-and-aip.service";
import { ProductPublishComponent } from "../publish/product-publish.component";
import { CallStatus } from "../../common/call-status";
import {sanitizeDataTypeName, selectPreferredName, selectPreferredValues} from '../../common/utils';
import { ParentCategories } from "../model/category/parent-categories";
import { sortCategories,scrollToDiv } from "../../common/utils";
import { Property } from "../model/category/property";
import * as myGlobals from '../../globals';
import { AppComponent } from "../../app.component";
import { Text} from '../model/publish/text';
import { Observable } from "rxjs/Observable";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { SimpleSearchService } from "../../simple-search/simple-search.service";

type ProductType = "product" | "transportation";
type SelectedTab = "TREE"
    | "FAVORITE"
    | "RECENT";

@Component({
    selector: "category-search",
    templateUrl: "./category-search.component.html",
    styleUrls: ["./category-search.component.css"]
})
export class CategorySearchComponent implements OnInit {

    selectedTab: SelectedTab = "TREE";

    getCategoriesStatus: CallStatus = new CallStatus();
    favoriteCategoriesStatus: CallStatus = new CallStatus();
    recentCategoriesStatus: CallStatus = new CallStatus();
    addFavoriteCategoryStatus: CallStatus = new CallStatus();
    addRecentCategoryStatus: CallStatus = new CallStatus();
    getCategoryDetailsStatus: CallStatus = new CallStatus();

    categories: Category[];
    pageRef: string = null;
    publishingGranularity: string;

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
    taxonomyId: string = myGlobals.config.standardTaxonomy;
    categoryFilter = myGlobals.config.categoryFilter;
    taxonomyIDs: string[];
    prefCats: string[] = [];
    recCats: string[] = [];

    isLogistics: boolean;
    logisticsCategory: Category = null;

    showOtherProperties = null;
    productType: ProductType;

    favSelected: boolean;

    scrollToDivId = null;
    // stores the parents of the selected category. We need this since changing parentCategories in tree view results in some problems.
    pathToSelectedCategories = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private cookieService: CookieService,
        private userService: UserService,
        public categoryService: CategoryService,
        private simpleSearchService: SimpleSearchService,
        private catalogueService: CatalogueService,
        private publishService: PublishService,
        public appComponent: AppComponent
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            // current page regs considered: menu, publish, null
            this.pageRef = params["pageRef"];

            //set product type
            this.productType = params["productType"] === "transportation" ? "transportation" : "product";
            this.isLogistics = this.productType === "transportation";

            // This part is necessary since only the params has changes,canDeactivate method will not be called.
            if (this.inPublish == true && this.pageRef == "menu") {
                if (!confirm("You will lose any changes you made, are you sure you want to quit ?")) {
                    return;
                }
            }

            // If pageRef is 'publish',then user is publishing.
            if (this.pageRef == "publish") {
                this.inPublish = true;
            }

            if (this.pageRef == null || this.pageRef == "menu") {
                // reset categories
                this.categoryService.resetSelectedCategories();
                this.selectedCategory = null;
                this.selectedCategoryWithDetails = null;
                this.pathToSelectedCategories = null;
                // reset draft catalogue line
                this.publishService.publishingStarted = false;
                this.publishService.publishMode = "create";
            }

            // get the favorite categories
            this.getFavoriteCategories();

            // get the recently used categories
            this.getRecentCategories();

            // publishing granularity: single, bulk, null
            this.publishingGranularity = params["pg"];
            if (this.pageRef == null) {
                this.pageRef = "single";
            }

            // handle category query term
            this.categoryKeyword = params["cat"];
            if (this.categoryKeyword != null) {
                this.getCategories();
            }
        });
        // get available taxonomy ids
        this.categoryService.getAvailableTaxonomies().then(taxonomyIDs => {
            this.taxonomyIDs = ["All"];
            for(let i = 0; i < taxonomyIDs.length;i++){
                this.taxonomyIDs.push(taxonomyIDs[i]);
            }
            this.getRootCategories(this.taxonomyId == "All" ? "eClass" : this.taxonomyId);
        })
    }

    onSelectTab(event: any) {
        event.preventDefault();
        if (!this.getCategoryDetailsStatus.isDisplayed())
          this.selectedTab = event.target.id;
    }

    private getFavoriteCategories() {
        this.prefCats = [];
        this.favoriteCategoriesStatus.submit();
        let userId = this.cookieService.get("user_id");
        this.userService.getPrefCat(userId).then(res => {
            var prefCats_tmp = [];
            for (var i = 0; i < res.length; i++) {
                if (res[i].split("::")[3] == this.productType) prefCats_tmp.push(res[i]);
            }
            prefCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
            this.prefCats = prefCats_tmp;
            this.favoriteCategoriesStatus.callback("Succesfully fetched favorite categories", true);
        })
        .catch(error => {
            this.favoriteCategoriesStatus.error("Error while fetching favorite categories.", error);
        });
    }

    private getRecentCategories() {
      this.recCats = [];
      this.recentCategoriesStatus.submit();
      let userId = this.cookieService.get("user_id");
      this.userService.getRecCat(userId).then(res => {
          var recCats_tmp = [];
          for (var i = 0; i < res.length; i++) {
              if (res[i].split("::")[3] == this.productType) recCats_tmp.push(res[i]);
          }
          recCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
          this.recCats = recCats_tmp;
          this.recentCategoriesStatus.callback("Succesfully fetched recent categories", true);
      })
      .catch(error => {
          this.recentCategoriesStatus.error("Error while fetching favorite categories.", error);
      });
    }

    findPrefCat(cat: Category): boolean {
        var cat_str = cat.id + "::" + cat.taxonomyId + "::" + selectPreferredName(cat) + "::" + this.productType;
        var found = false;
        if (this.prefCats.indexOf(cat_str) != -1) found = true;
        return found;
    }

    removeCategoryFromFavorites(cat: Category) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
          this.addFavoriteCategoryStatus.submit();
          const cat_str = cat.id + "::" + cat.taxonomyId + "::" + selectPreferredName(cat) + "::" + this.productType;
          const userId = this.cookieService.get("user_id");
          this.userService.togglePrefCat(userId, cat_str).then(res => {
              const prefCats_tmp = [];
              for (var i = 0; i < res.length; i++) {
                  if (res[i].split("::")[3] == this.productType) prefCats_tmp.push(res[i]);
              }
              prefCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
              this.prefCats = prefCats_tmp;
              this.addFavoriteCategoryStatus.callback("Category removed from favorites", true);
          })
          .catch(error => {
              this.addFavoriteCategoryStatus.error("Error while removing category from favorites", error);
          });
        }
    }

    addCategoryToFavorites(cat: Category) {
        if (!this.addFavoriteCategoryStatus.isLoading()) {
          this.addFavoriteCategoryStatus.submit();
          const cat_str = cat.id + "::" + cat.taxonomyId + "::" + selectPreferredName(cat) + "::" + this.productType;
          const userId = this.cookieService.get("user_id");
          this.userService.togglePrefCat(userId, cat_str).then(res => {
              const prefCats_tmp = [];
              for (var i = 0; i < res.length; i++) {
                  if (res[i].split("::")[3] == this.productType) prefCats_tmp.push(res[i]);
              }
              prefCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
              this.prefCats = prefCats_tmp;
              this.addFavoriteCategoryStatus.callback("Category added to favorites", true);
          })
          .catch(error => {
              this.addFavoriteCategoryStatus.error("Error while adding category to favorites", error);
          });
        }
    }

    addRecentCategories(cat: Category[]) {
      this.addRecentCategoryStatus.submit();
      var recCatPost = [];
      var timeStamp = new Date().getTime();
      for (var i=0; i<cat.length; i++) {
        const cat_str = cat[i].id + "::" + cat[i].taxonomyId + "::" + selectPreferredName(cat[i]) + "::" + this.productType + "::" + timeStamp;
        recCatPost.push(cat_str);
      }
      const userId = this.cookieService.get("user_id");
      this.userService.addRecCat(userId, recCatPost).then(res => {
        var recCats_tmp = [];
        for (var i = 0; i < res.length; i++) {
            if (res[i].split("::")[3] == this.productType) recCats_tmp.push(res[i]);
        }
        recCats_tmp.sort((a, b) => a.split("::")[2].localeCompare(b.split("::")[2]));
        this.recCats = recCats_tmp;
        this.addRecentCategoryStatus.callback("Categories added to recently used", true);
      })
      .catch(error => {
          this.addRecentCategoryStatus.error("Error while adding categories to recently used", error);
      });
    }

    selectPreferredName(cp: Category | Property) {
        return selectPreferredName(cp);
    }

    isDefinitionOrRemarkAvailable(property: Property): boolean {
        return (property.definition != null && property.definition.trim().length > 0) || (property.remark != null && property.remark.length > 0);
    }

    getPropertyDefinitionOrRemark(property: Property): string {
        if(property.definition != null && property.definition.trim().length > 0) {
            return property.definition;
        }
        if(property.remark != null && property.remark.length > 0) {
            return selectPreferredValues(property.remark)[0];
        }
        return "";
    }

    canDeactivate(): boolean {
        this.inPublish = false;
        if (this.pageRef == "publish" && this.isReturnPublish == false) {
            if (!confirm("You will lose any changes you made, are you sure you want to quit ?")) {
                return false;
            }
        }
        return true;
    }

    onSearchCategory(): void {
        this.parentCategories = null;
        this.pathToSelectedCategories = null;
        this.selectedCategoryWithDetails = null;
        this.treeView = false;
        this.router.navigate(["/catalogue/categorysearch"], {
            queryParams: {
                pg: this.publishingGranularity,
                pageRef: this.pageRef,
                cat: this.categoryKeyword,
                productType: this.productType
            }
        });
    }

    toggleTreeView(): void {
        this.treeView = !this.treeView;
    }

    private getRootCategories(taxonomyId:string): any {
        this.getCategoriesStatus.submit();
        this.categoryService
            .getRootCategories(taxonomyId)
            .then(rootCategories => {
                this.rootCategories = sortCategories(rootCategories);
                this.getCategoriesStatus.callback("Retrieved category details", true);
                if (this.categoryFilter[taxonomyId]) {
                  this.logisticsCategory = this.rootCategories.find(c => c.code === this.categoryFilter[taxonomyId].logisticsCategory);
                  if(this.logisticsCategory != null){
                      let searchIndex = this.findCategoryInArray(this.rootCategories, this.logisticsCategory);
                      this.rootCategories.splice(searchIndex, 1);
                  }
                  for (var i=0; i<this.categoryFilter[taxonomyId].hiddenCategories.length; i++) {
                      let filterCat = this.rootCategories.find(c => c.code === this.categoryFilter[taxonomyId].hiddenCategories[i]);
                      if(filterCat != null){
                          let searchIndex = this.findCategoryInArray(this.rootCategories, filterCat);
                          this.rootCategories.splice(searchIndex, 1);
                      }
                  }
                }
            })
            .catch(error => {
                this.getCategoriesStatus.error("Failed to retrieve category details", error);
            });
    }

    getSuggestions = (text$: Observable<string>) =>
      text$.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(term =>
          this.simpleSearchService.getClassSuggestions(term,("{LANG}_label"),this.taxonomyId == "All" ? "" : this.categoryFilter[this.taxonomyId].ontologyPrefix)
        )
      );

    displayRootCategories(taxonomyId: string): void {
        this.treeView = true;
        this.taxonomyId = taxonomyId;
        this.getRootCategories(this.taxonomyId == "All" ? "eClass" : this.taxonomyId);
    }

    private getCategories(): void {
        this.getCategoriesStatus.submit();
        this.categoryService
            .getCategoriesByName(this.categoryKeyword, this.taxonomyId,this.isLogistics)
            .then(categories => {
                this.parentCategories = null;
                this.pathToSelectedCategories = null;
                this.categories = categories;
                this.getCategoriesStatus.callback("Successfully got search results", true);
            })
            .catch(error => {
                this.getCategoriesStatus.error("Error while searching for categories", error);
            });
    }

    addCategoryToSelected(category: Category): void {
        // if no category is selected or if the selected category is already selected
        // do nothing
        if (category == null || this.findCategoryInArray(this.categoryService.selectedCategories, category) > -1) {
            return;
        }

        if(this.selectedCategoryWithDetails !== category) {
            throw new Error("Inconsistent state: can only select the details category.");
        }

        this.categoryService.addSelectedCategory(category);
        this.selectedCategories.push(category);
    }

    removeCategoryFromSelected(category: Category): void {
        let index = this.findCategoryInArray(this.categoryService.selectedCategories, category);
        if (index > -1) {
            this.categoryService.selectedCategories.splice(index, 1);
            let searchIndex = this.findCategoryInArray(this.selectedCategories, category);
            if (searchIndex > -1) {
                this.selectedCategories.splice(searchIndex, 1);
            }
        }
    }

    navigateToPublishingPage(): void {
        this.addRecentCategories(this.selectedCategories);
        ProductPublishComponent.dialogBox = true;
        // set isReturnPublish in order not to show confirmation popup
        this.isReturnPublish = true;
        this.router.navigate(["catalogue/publish"], { queryParams: { pg: this.publishingGranularity, productType: this.productType } });
    }

    getCategoryTree(category: Category,scrollToDivId = null) {
        this.selectedCategoryWithDetails = null;
        this.treeView = true;
        this.taxonomyId = category.taxonomyId;
        this.getCategoriesStatus.submit();
        this.categoryService
            .getParentCategories(category)
            .then(categories => {
                this.categoryService
                    .getCategory(category)
                    .then(category => {
                        this.rootCategories = sortCategories(categories.categories[0]);
                        if(!scrollToDivId){
                            this.scrollToDivId = category.code;
                        }
                        else {
                            this.scrollToDivId = scrollToDivId;
                        }
                        this.selectedCategoryWithDetails = category;
                        this.selectedCategory = category;
                        this.parentCategories = categories; // parents categories
                        this.pathToSelectedCategories = this.parentCategories;
                        this.selectedCategoriesWRTLevels = [];
                        for (let parent of this.parentCategories.parents) {
                            this.selectedCategoriesWRTLevels.push(parent.code);
                        }
                        this.getCategoriesStatus.callback(null);
                        if (this.treeView) {
                          setTimeout(function(){
                            scrollToDiv(category.code);
                            document.getElementById("scrollDiv").scrollTop-=57;
                          },100);
                        }
                    })
                    .catch(error => {
                        this.getCategoriesStatus.error("Error while fetching category.", error);
                    });
            })
            .catch(error => {
                this.getCategoriesStatus.error("Error while fetching parrent category.", error);
            });
    }

    showAdDetails(cat: string) {
        var cat_split = cat.split("::");
        var catFull: Category = {
            id: cat_split[0],
            preferredName: [new Text(cat_split[2])],
            code: "",
            level: 0,
            definition: [],
            note: "",
            remark: "",
            properties: [],
            keywords: [],
            taxonomyId: cat_split[1],
            categoryUri: ""
        };
        this.getCategoryDetails(catFull, true);
    }

    isAdSelected(cat: string): boolean {
        if (this.selectedCategory != null && this.favSelected == true) {
            return cat.split("::")[0] === this.selectedCategory.id;
        }
        return false;
    }

    getCategoryDetails(category: Category, fav: boolean) {
        if (!this.getCategoryDetailsStatus.isDisplayed()) {
          if (!this.selectedCategory ||  (this.selectedCategory && this.selectedCategory.id !== category.id)) {
            this.favSelected = fav;
            this.selectedCategory = category;
            this.selectedCategoryWithDetails = null;
            this.getCategoryDetailsStatus.submit();

            this.showOtherProperties = false;
            this.categoryService
                .getCategory(category)
                .then(category => {
                    this.categoryService.getParentCategories(category).then(parentCategories => {
                        this.pathToSelectedCategories = parentCategories;
                        this.getCategoryDetailsStatus.callback("Retrieved details of the category", true);
                        this.selectedCategoryWithDetails = category;
                        if (this.treeView) {
                          setTimeout(function(){
                            scrollToDiv(category.code);
                            document.getElementById("scrollDiv").scrollTop-=57;
                          },100);
                        }
                    }).catch(error => {
                        this.getCategoryDetailsStatus.error("Failed to retrieved parents of the category",error);
                    })

                })
                .catch(error => {
                    this.getCategoryDetailsStatus.error("Failed to retrieved details of the category", error);
                });
          }
        }
    }

    getCategoryProperty(propName): string {
        // Type of the definition field is Text[]. Therefore, we have to use selectPreferredValues method
        // to get proper value of this category property
        if(propName == "definition"){
            return selectPreferredValues(this.selectedCategoryWithDetails[propName])[0];
        }
        return String(this.selectedCategoryWithDetails[propName]);
    }

    getPropertyType(property: Property): string {
        return sanitizeDataTypeName(property.dataType);
    }

    private findCategoryInArray(categoryArray: Category[], category: Category): number {
        return categoryArray.findIndex(c => c.id == category.id);
    }

    private changeTaxonomyId(taxonomyId){
        if (this.taxonomyId != taxonomyId) {
          this.parentCategories = null;
          this.pathToSelectedCategories = null;
          this.selectedCategory = null;
          this.selectedCategoryWithDetails = null;
          this.taxonomyId = taxonomyId;
          if(this.categoryKeyword){
              this.getCategories();
          }
          if(this.selectedTab == "TREE"){
              this.getRootCategories(this.taxonomyId == "All" ? "eClass" : this.taxonomyId);
          }
        }
    }

    private scrollToDiv(divId:string,event:any){
        //this.scrollToDivId = divId;
        // if treeView is false,firstly we have to switch to tree view
        if (!this.getCategoryDetailsStatus.isDisplayed()) {
          if(!this.treeView){
              this.getCategoryTree(this.selectedCategoryWithDetails,divId);
          }
          else{
              scrollToDiv(divId);
              document.getElementById("scrollDiv").scrollTop-=57;
          }
        }
    }
}
