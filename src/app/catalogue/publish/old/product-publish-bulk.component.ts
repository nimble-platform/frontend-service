// import { Component, OnInit } from "@angular/core";
// import { PublishService } from "../publish-and-aip.service";
// import { PublishMode } from "../model/publish/publish-mode";
// import { CallStatus } from "../../common/call-status";
// import { CategoryService } from "../category/category.service";
// import { Category } from "../model/category/category";

// import 'file-saver';
// import { CatalogueLine } from "../model/publish/catalogue-line";
// import { ActivatedRoute, Params } from "@angular/router";
// import { CookieService } from "ng2-cookies";
// import { UserService } from "../../user-mgmt/user.service";
// import { CatalogueService } from "../catalogue.service";

// @Component({
//     selector: 'product-publish-bulk',
//     templateUrl: './product-publish-bulk.component.html',
// })
// export class ProductPublishBulkComponent implements OnInit {

//     publishMode: PublishMode;
//     catalogueLine: CatalogueLine;
//     selectedCategories: Category[];

//     callStatus: CallStatus = new CallStatus();

//     constructor(private publishService: PublishService,
//                 private categoryService: CategoryService,
//                 private userService: UserService,
//                 private catalogueService: CatalogueService,
//                 private cookieService: CookieService
//         /*
//                 private categoryService: CategoryService,
//                 private catalogueService: CatalogueService,
//                 private userService: UserService,
//                 private router: Router,
//                 private route: ActivatedRoute,
//                 private cookieService: CookieService
//     */) {
//     }

//     ngOnInit() {
//         this.publishMode = this.publishService.publishMode;
//         this.selectedCategories = this.categoryService.selectedCategories;

//         let userId = this.cookieService.get("user_id");
//         // this.userService.getUserParty(userId).then(party => {
//         //     this.catalogueService.getCatalogue(userId).then(catalogue => {
//         //         this.initView(party, catalogue);
//         //         this.publishStateService.publishingStarted = true;
//         //     });
//         // });
//     }

//     // private initView(userParty, userCatalogue): void {
//     //     this.catalogueService.setEditMode(true);
//     //     this.publishStateService.resetData();
//     //     // Following "if" block is executed when redirected by an "edit" button
//     //     // "else" block is executed when redirected by "publish" tab
//     //     let publishMode = this.publishStateService.publishMode;
//     //     if (publishMode == 'edit') {
//     //         this.catalogueLine = this.catalogueService.draftCatalogueLine;
//     //         if (this.catalogueLine == null) {
//     //             this.publishStateService.publishMode = 'create';
//     //             this.router.navigate(['catalogue/publish']);
//     //             return;
//     //         }

//     //         // Get categories of item to edit
//     //         if(this.publishStateService.publishingStarted == false) {
//     //             let classificationCodes: Code[] = [];
//     //             for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {
//     //                 classificationCodes.push(classification.itemClassificationCode);
//     //             }

//     //             if (classificationCodes.length > 0) {
//     //                 // temporarily store publishing started variable as it will be used inside the following callback
//     //                 this.productCategoryRetrievalStatus.submit();
//     //                 //let publishingModeStarted = this.publishStateService.publishingStarted;
//     //                 this.categoryService.getCategoriesByIds(classificationCodes).then((categories: Category[]) => {
//     //                     // upon navigating from the catalogue view, classification codes are set as selected categories

//     //                     for (let category of categories) {
//     //                         this.categoryService.selectedCategories.push(category);
//     //                     }

//     //                     if (this.categoryService.selectedCategories != []) {
//     //                         for (let category of this.categoryService.selectedCategories) {
//     //                             let newCategory = this.isNewCategory(category);
//     //                             if (newCategory) {
//     //                                 this.updateItemWithNewCategory(category);
//     //                             }
//     //                         }
//     //                     }

//     //                     // Following method is called when editing to make sure the item has
//     //                     // all properties of its categories in the correct order
//     //                     this.restoreItemProperties();
//     //                     this.productCategoryRetrievalStatus.callback('Retrieved product categories', true);
//     //                 }).catch(err =>
//     //                     this.productCategoryRetrievalStatus.error('Failed to get product categories')
//     //                 );
//     //             }

//     //         } else {
//     //             for (let category of this.categoryService.selectedCategories) {
//     //                 let newCategory = this.isNewCategory(category);
//     //                 if (newCategory) {
//     //                     this.updateItemWithNewCategory(category);
//     //                 }
//     //             }
//     //         }

//     //     } else {
//     //         // new publishing is the first entry to the publishing page
//     //         // i.e. publishing from scratch
//     //         if (this.publishStateService.publishingStarted == false) {
//     //                 this.catalogueLine = UBLModelUtils.createCatalogueLine(userCatalogue.uuid, userParty);
//     //                 this.catalogueService.draftCatalogueLine = this.catalogueLine;
//     //         } else {
//     //             this.catalogueLine = this.catalogueService.draftCatalogueLine;
//     //         }

//     //         for (let category of this.categoryService.selectedCategories) {
//     //             let newCategory = this.isNewCategory(category);
//     //             if (newCategory) {
//     //                 this.updateItemWithNewCategory(category);
//     //             }
//     //         }
//     //     }
//     // }

//     /*
//      * Event Handlers
//      */


//     /**
//      * deselect a category
//      * 1) remove the property from additional item properties
//      * 2) remove the category from the selected categories
//      * 3) remove the corresponding commodity classification from the item
//      */
//     categoryCancel(category:Category) {
//         let index = this.categoryService.selectedCategories.findIndex(c => c.id == category.id);
//         if (index > -1) {
//             this.catalogueLine.goodsItem.item.additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.filter(function (el) {
//                 return el.itemClassificationCode.value != category.id;
//             });

//             this.categoryService.selectedCategories.splice(index, 1);
//         }

//         let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.value == category.id);
//         if (i > -1) {
//             this.catalogueLine.goodsItem.item.commodityClassification.splice(i, 1);
//         }
//     }

    
//     /*
//      * Getters and Setters
//      */


// }
