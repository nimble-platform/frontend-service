/**
 * Created by suat on 17-May-17.
 */

import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import {CategoryService} from "./category/category.service";
import {ItemProperty} from "./model/publish/item-property";
import {BinaryObject} from "./model/publish/binary-object";
import {CatalogueService} from "./catalogue.service";
import {Category} from "./model/category/category";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Catalogue} from "./model/publish/catalogue";
import {CookieService} from "ng2-cookies";
import {UBLModelUtils} from "./model/ubl-model-utils";
import {ActivatedRoute, Params, Router} from "@angular/router";
import 'rxjs/Rx' ;
import {Code} from "./model/publish/code";
import {PublishService} from "./publish-and-aip.service";
import {UserService} from "../user-mgmt/user.service";
import {ItemPropertyDataSourcePipe} from "./item-property-data-source-pipe";
import {Quantity} from "./model/publish/quantity";

const uploadModalityKey: string = "UploadModality";

@Component({
    selector: 'product-publish',
    providers: [ItemPropertyDataSourcePipe],
    templateUrl: './product-publish.component.html',
})

export class ProductPublishComponent implements OnInit {
    @ViewChild('propertyValueType') propertyValueType: ElementRef;

    /*
     * data objects
     */

    // reference to the selected categories for the draft item
    private selectedCategories: Category[] = [];
    // reference to the draft item itself
    private catalogueLine: CatalogueLine = null;
    // placeholder for the custom property
    private newProperty: ItemProperty = UBLModelUtils.createAdditionalItemProperty(null, null);

    // indicates whether the navigation is done for the first time
    newPublishing:boolean = true;
    // boolean to indicate whether it's a new publish or an edit
    editMode: boolean = false;

    /*
     * state objects for feedback about the publish operation
     */
    singleItemUpload: boolean = this.isSingleItemUpload();
    private submitted = false;
    private callback = false;
    private error_detc = false;

    private fb_bulk_publish_submitted = false;
    private fb_bulk_publish_callback = false;
    private fb_bulk_publish_errordetc = false;
    private fb_bulk_publish_message = "Message";


    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private publishStateService: PublishService,
                private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService) {
        this.selectedCategories = this.categoryService.selectedCategories;
    }

    ngOnInit() {
        this.route.queryParams.subscribe((params: Params) => {
            this.newPublishing = params['newPublishing'] == "true";
            this.editMode = params['edit'] == "true";
            let userId = this.cookieService.get("user_id");
            this.catalogueService.getCatalogue(userId).then(catalogue => {
                this.initView();
                }
            );
        });
    }

    private initView(): void {
        this.catalogueService.setEditMode(true);
        this.publishStateService.resetData();

        // Following "if" block is executed when redirected by an "edit" button
        // "else" block is executed when redirected by "publish" tab
        if (this.editMode) {
            // Initialization (draft item is already initialized while navigating from the catalogue views)
            // TODO eliminate this edit mode / new publishing differentiation
            if(this.newPublishing) {
                this.categoryService.resetData();
            }
            this.catalogueLine = this.catalogueService.draftCatalogueLine;
            if(this.catalogueLine == null) {
                this.router.navigate(['publish'], {queryParams: {newPublishing: true, edit: false}});
                return;
            }

            // Get categories of item to edit
            let classificationCodes: Code[] = [];
            for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {
                classificationCodes.push(classification.itemClassificationCode);
            }

            if(classificationCodes.length > 0) {
                this.categoryService.getCategoriesByIds(classificationCodes).then(
                    (categories: Category[]) => {
                        // upon navigating from the catalogue view, classification codes are set as selected categories
                        if (this.newPublishing) {
                            for (let category of categories) {
                                this.selectedCategories.push(category);
                            }
                        }

                        if (this.selectedCategories != []) {
                            for (let category of this.selectedCategories) {
                                let newCategory = this.isNewCategory(category);
                                if (newCategory) {
                                    this.updateItemWithNewCategory(category);
                                }
                            }
                        }

                        // Following method is called when editing to make sure the item has
                        // all properties of its categories in the correct order
                        this.restoreItemProperties();
                    });
            }

        } else {
            let userId = this.cookieService.get("user_id");
            this.userService.getUserParty(userId).then(party => {

                // new publishing is the first entry to the publishing page
                if (this.newPublishing) {
                    this.catalogueLine = UBLModelUtils.createCatalogueLine(party)
                    this.catalogueService.setDraftItem(this.catalogueLine);

                    // this "else" is required when coming back from the catalogue selection page in editing
                } else {
                    this.catalogueLine = this.catalogueService.draftCatalogueLine;
                }

                if (this.selectedCategories != []) {
                    for (let category of this.selectedCategories) {
                        let newCategory = this.isNewCategory(category);

                        if (newCategory) {
                            this.updateItemWithNewCategory(category);
                        }
                    }
                }
            });
        }
    }

    /**
     * Ensures the user is presented with all properties of the category when editing
     */
    private restoreItemProperties() {
        let newProperties: ItemProperty[] = [];
        let existingProperties: ItemProperty[] = this.catalogueLine.goodsItem.item.additionalItemProperty;
        let customProperties: ItemProperty[] = [];

        // prepare empty category fields
        for (let category of this.selectedCategories) {
            for (let property of category.properties) {
                let aip = UBLModelUtils.createAdditionalItemProperty(property, category);
                //aip.propertyDefinition = property.definition;

                // Make sure each property is pushed once
                if (newProperties.findIndex(p => p.id == property.id) <= -1) {
                    newProperties.push(aip);
                }
            }
        }

        // gather the custom properties
        for (let i = 0; i < existingProperties.length; i++) {
            if (existingProperties[i].itemClassificationCode.listID == "Custom") {
                customProperties.push(existingProperties[i]);
            }
        }

        // replace the empty properties with the existing ones
        for (let i = 0; i < newProperties.length; i++) {
            for (let j = customProperties.length; j < existingProperties.length; j++) {
                // If a property already exists, copy it over
                if (newProperties[i].id == existingProperties[j].id) {
                    newProperties[i] = existingProperties[j];
                }
            }
        }

        newProperties = customProperties.concat(newProperties);
        this.catalogueLine.goodsItem.item.additionalItemProperty = newProperties;
    }

    private updateItemWithNewCategory(category: Category): void {
        let commodityClassification = UBLModelUtils.createCommodityClassification(category);
        this.catalogueLine.goodsItem.item.commodityClassification.push(commodityClassification);

        loop1:
        for (let property of category.properties) {
            let aip = UBLModelUtils.createAdditionalItemProperty(property, category);
            // check whether the same property exists already
            for (let existingAip of this.catalogueLine.goodsItem.item.additionalItemProperty) {
                if (aip.id == existingAip.id) {
                    continue loop1;
                }
            }

            this.catalogueLine.goodsItem.item.additionalItemProperty.push(aip);
        }
        this.catalogueLine.goodsItem.item.additionalItemProperty = [].concat(this.catalogueLine.goodsItem.item.additionalItemProperty);
    }

    private onTabClick(event: any) {
        event.preventDefault();
        if (event.target.id == "singleUpload") {
            this.singleItemUpload = true;
            localStorage.setItem(uploadModalityKey, "singleUpload");
        } else {
            this.singleItemUpload = false;
            localStorage.setItem(uploadModalityKey, "bulkUpload");
        }
    }

    private addCategoryOnClick(event: any): void {
        this.router.navigate(['categorysearch'], {queryParams: {newPublishing: false, edit: this.editMode}});
    }

    private publishProduct(): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
        // add new line to the end of catalogue
        this.catalogueService.catalogue.catalogueLine.push(splicedCatalogueLine);

        if (this.catalogueService.catalogue.uuid == null) {
            this.catalogueService.postCatalogue(this.catalogueService.catalogue)
                .then(() => this.onSuccessfulPublish())
                .catch(() => this.onFailedPublish());

        } else {
            this.catalogueService.putCatalogue(this.catalogueService.catalogue)
                .then(() => this.onSuccessfulPublish())
                .catch(() => this.onFailedPublish())
        }
    }

    private editProduct(): void {

        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);

        // Replace original line in the catalogue with the edited version
        let indexOfOriginalLine = this.catalogueService.catalogue.catalogueLine.indexOf(this.catalogueService.originalCatalogueLine);
        this.catalogueService.catalogue.catalogueLine[indexOfOriginalLine] = splicedCatalogueLine;

        if (this.catalogueService.catalogue.uuid == null) {
            this.catalogueService.postCatalogue(this.catalogueService.catalogue)
                .then(() => this.onSuccessfulPublish())
                .catch(() => this.onFailedPublish());

        } else {
            this.catalogueService.putCatalogue(this.catalogueService.catalogue)
                .then(() => this.onSuccessfulPublish())
                .catch(() => this.onFailedPublish())
        }
    }

    // Removes empty properties from catalogueLines about to be sent
    private removeEmptyProperties(catalogueLine: CatalogueLine): CatalogueLine {

        // Make deep copy of catalogue line so we can remove empty fields without disturbing UI model
        // This is required because there is no redirect after publish action
        let catalogueLineCopy: CatalogueLine = JSON.parse(JSON.stringify(catalogueLine));

        // splice out properties that are unfilled
        let properties: ItemProperty[] = catalogueLineCopy.goodsItem.item.additionalItemProperty;
        let propertiesToBeSpliced: ItemProperty[] = [];

        for (let property of properties) {
            let valueQualifier:string = property.valueQualifier.toLocaleLowerCase();
            if(valueQualifier == "real_measure" ||
                valueQualifier == "int" ||
                valueQualifier == "double" ||
                valueQualifier == "number") {
                if(property.valueDecimal.length == 0 || property.valueDecimal[0] == undefined) {
                    propertiesToBeSpliced.push(property);
                }

            } else if(valueQualifier == "binary") {
                if(property.valueBinary.length == 0) {
                    propertiesToBeSpliced.push(property);
                }

            } else if(valueQualifier.toLowerCase() == 'quantity') {
                if(property.valueQuantity.length == 0) {
                    propertiesToBeSpliced.push(property);
                }

            } else{
                if(property.value.length == 0 || property.value[0] == '') {
                    propertiesToBeSpliced.push(property);
                }
            }
        }

        for (let property of propertiesToBeSpliced) {
            properties.splice(properties.indexOf(property), 1);
        }

        return catalogueLineCopy;
    }

    private onSuccessfulPublish(): void {
        let userId = this.cookieService.get("user_id");
        this.userService.getUserParty(userId).then(party => {
            this.catalogueLine = UBLModelUtils.createCatalogueLine(party)
            this.catalogueService.setDraftItem(this.catalogueLine);

            // avoid category duplication
            this.categoryService.resetSelectedCategories();
            this.publishStateService.resetData();
            this.router.navigate(['catalogue']);

            this.callback = true;
            this.error_detc = false;

        });
    }

    private onFailedPublish(): void {
        this.error_detc = true;
    }



    private onValueTypeChange(event: any) {
        if (event.target.value == "Text") {
            this.newProperty.valueQualifier = "STRING";
        } else if (event.target.value == "Number") {
            this.newProperty.valueQualifier = "REAL_MEASURE";
        } else if (event.target.value == "Image" || event.target.value == "File") {
            this.newProperty.valueQualifier = "BINARY";
        }
    }

    private imageChange(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.valueBinary;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                let reader = new FileReader();

                reader.onload = function (e: any) {
                    let base64String = reader.result.split(',').pop();
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    //TODO update the method below so that the parameters are passed dynamically
    private overallProductImageImage(event: any, wallTilesValue: string, floorTilesValue: string) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let itemConfigurationImageArray = this.catalogueLine.goodsItem.item.itemConfigurationImageArray;
            let file: File = fileList[0];
            let reader = new FileReader();

            reader.onload = function (e: any) {
                let base64String = reader.result.split(',').pop();
                let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "{wall: " + wallTilesValue + ", floor: " + floorTilesValue + "}");
                itemConfigurationImageArray.push(binaryObject);
            };
            reader.readAsDataURL(file);
        }
    }

    private fileChange(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.valueBinary;

            for (let i = 0; i < fileList.length; i++) {
                let file: File = fileList[i];
                let reader = new FileReader();

                reader.onload = function (e: any) {
                    let base64String = reader.result.split(',').pop();
                    console.log(base64String);
                    console.log(file.type);
                    let binaryObject = new BinaryObject(base64String, file.type, file.name, "", "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    /* cancel an image upload */
    imageCancel(fileName: string) {
        let binaryObjects = this.newProperty.valueBinary;

        let index = binaryObjects.findIndex(img => img.fileName === fileName);

        console.log(index);
        if (index > -1) {
            binaryObjects.splice(index, 1);
        }
    }

    customPropertyValueCancel(val: string) {
        let index = this.newProperty.value.indexOf(val);
        this.newProperty.value.splice(index, 1);
    }

    /**
     * deselect a category
     * 1) remove the property from additional item properties
     * 2) remove the category from the selected categories
     * 3) remove the corresponding commodity classification from the item
     */
    categoryCancel(categoryId: string) {
        let c = 0;

        let index = this.selectedCategories.findIndex(c => c.id == categoryId);
        if (index > -1) {

            for (let property of this.selectedCategories[index].properties) {
                // check whether the property of the deleted category are included in other properties,
                // which is the case for base eClass properties
                c = 0;
                for (let category of this.selectedCategories) {
                    if (category.id == categoryId)
                        continue;

                    for (let p of category.properties) {
                        if (property.id == p.id)
                            c++;
                    }
                }
                // if the property is not included in other categories, remove it from the additional item properties
                if (c == 0) {

                    let j = this.catalogueLine.goodsItem.item.additionalItemProperty.findIndex(p => p.id == property.id);
                    if (j > -1) {
                        this.catalogueLine.goodsItem.item.additionalItemProperty.splice(j, 1);
                        // FIXME: dirty hack so that angular would recognize the change in the additionItemProperty array
                        // https://stackoverflow.com/questions/36247016/angular2-refreshing-view-on-array-push
                        // https://stackoverflow.com/questions/40829951/angular2-ngfor-onpush-change-detection-with-array-mutations
                        this.catalogueLine.goodsItem.item.additionalItemProperty = [].concat(this.catalogueLine.goodsItem.item.additionalItemProperty);
                    }
                }
            }

            this.selectedCategories.splice(index, 1);
        }

        let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.value == categoryId);
        if (i > -1) {
            this.catalogueLine.goodsItem.item.commodityClassification.splice(i, 1);
        }
    }

    /**
     * Adds the new property to the end of existing custom properties. Processes the value arrays of the property;
     * keeps only the relevant array based on the value qualifier and removes the empty values
     */
    private addCustomProperty(): void {
        // remove empty/undefined values and keep only the the data array relevant to the value qualifier
        if(this.newProperty.valueQualifier == "STRING") {
            let filledValues:string[] = [];
            for(let val of this.newProperty.value) {
                if(val != "") {
                    filledValues.push(val);
                }
            }

            this.newProperty.value = filledValues;
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];

        } else if(this.newProperty.valueQualifier == "REAL_MEASURE") {
            let filledValues:number[] = [];
            for(let val of this.newProperty.valueDecimal) {
                if(val != undefined && val != null && val.toString() != "") {
                    filledValues.push(val);
                }
            }

            this.newProperty.valueDecimal = filledValues;
            this.newProperty.value = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];

        } else if(this.newProperty.valueQualifier == "BINARY") {
            this.newProperty.value = [];
            this.newProperty.valueDecimal = [];
            this.newProperty.valueQuantity = [];

        } else if(this.newProperty.valueQualifier == 'QUANTITY') {
            let filledValues:Quantity[] = [];
            for(let val of this.newProperty.valueQuantity) {
                if(val != undefined && val != null && val.toString() != "") {
                    filledValues.push(val);
                }
            }
            this.newProperty.valueQuantity = filledValues;
            this.newProperty.value = [];
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
        }

        // add the custom property to the end of existing custom properties
        let i=0;
        for(i=0; i<this.catalogueLine.goodsItem.item.additionalItemProperty.length; i++) {
            if(this.catalogueLine.goodsItem.item.additionalItemProperty[i].itemClassificationCode.listID != "Custom") {
                break;
            }
        }
        this.catalogueLine.goodsItem.item.additionalItemProperty.splice(i, 0, this.newProperty);
        this.catalogueLine.goodsItem.item.additionalItemProperty = [].concat(this.catalogueLine.goodsItem.item.additionalItemProperty);

        // reset the custom property view
        this.newProperty = UBLModelUtils.createAdditionalItemProperty(null, null);
        this.propertyValueType.nativeElement.selectedIndex = 0;
    }

    private downloadTemplate() {
        this.fb_bulk_publish_submitted = true;

        let userId: string = this.cookieService.get("user_id");
        var reader = new FileReader();
        this.catalogueService.downloadTemplate(userId, this.selectedCategories)
            .then(result => {
                var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(result.content);
                link.download = result.fileName;
                link.click();
                this.fb_bulk_publish_callback = true;
                this.fb_bulk_publish_message = "Download completed";
            },
            error => {
                this.fb_bulk_publish_errordetc = true;
                this.fb_bulk_publish_message = "Failed to download";
            });
    }

    private uploadTemplate(event: any) {
        this.fb_bulk_publish_submitted = true;
        let catalogueService = this.catalogueService;
        let companyId: string = this.cookieService.get("company_id");
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadTemplate(userId, file).then(res => {
                        self.fb_bulk_publish_callback = true;
                        self.router.navigate(['catalogue'], {queryParams: {forceUpdate: true}});
                    },
                    error => {
                        self.fb_bulk_publish_errordetc = true;
                        self.fb_bulk_publish_message = "Failed to upload the template:  " + error;
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    private downloadExampleTemplate() {
        var reader = new FileReader();
        this.catalogueService.downloadExampleTemplate()
            .then(result => {
                    var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(result.content);
                    link.download = result.fileName;
                    link.click();
                    this.fb_bulk_publish_callback = true;
                    this.fb_bulk_publish_message = "Download completed";
                },
                error => {
                    this.fb_bulk_publish_errordetc = true;
                    this.fb_bulk_publish_message = "Failed to download";
                });
    }

    /**
     * Used to establish the two-way binding on the additional values of custom properties
     */
    trackByIndex(index: any, item: any) {
        return index;
    }

    addValueToProperty() {
        if(this.newProperty.valueQualifier == 'STRING') {
            this.newProperty.value.push('');
        } else if(this.newProperty.valueQualifier == 'REAL_MEASURE') {
            let newNumber:number;
            this.newProperty.valueDecimal.push(newNumber);
        }
    }

    removeValueFromProperty(valueIndex:number): void {
        if(this.newProperty.valueQualifier == 'STRING') {
            this.newProperty.value.splice(valueIndex, 1)
        } else if(this.newProperty.valueQualifier == 'REAL_MEASURE') {
            this.newProperty.valueDecimal.splice(valueIndex, 1)
        }
    }

    private isNewCategory(category: Category): boolean {
        let newCategory: boolean = true;
        for (let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification) {
            if (category.id == commodityClassification.itemClassificationCode.value) {
                newCategory = false;
                break;
            }
        }
        return newCategory;
    }

    private isSingleItemUpload(): boolean {
        let uploadModality: string = localStorage.getItem(uploadModalityKey);
        if (uploadModality == "singleUpload") {
            return true;
        } else {
            return false;
        }
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
