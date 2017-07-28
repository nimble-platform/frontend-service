/**
 * Created by suat on 17-May-17.
 */

import {Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import {CategoryService} from "./category/category.service";
import {ItemProperty} from "./model/publish/item-property";
import {BinaryObject} from "./model/publish/binary-object";
import {CatalogueService} from "./catalogue.service";
import {Category} from "./model/category/category";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Catalogue} from "./model/publish/catalogue";
import {CookieService} from "ng2-cookies";
import {ModelUtils} from "./model/model-utils";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ProductPropertiesComponent} from "./product-properties.component";
import {PublishAndAIPCService} from "./publish-and-aip.service";
import 'rxjs/Rx' ;
import {Code} from "./model/publish/code";

const uploadModalityKey: string = "UploadModality";

@Component({
    selector: 'product-publish',
    templateUrl: './product-publish.component.html',
})

export class ProductPublishComponent implements OnInit {
    @ViewChild('propertyValueType') propertyValueType: ElementRef;
    @ViewChild('productProperties') productProperties: ProductPropertiesComponent;

    /*
     * data objects
     */

    // reference to the selected categories for the draft item
    selectedCategories: Category[] = [];
    // reference to the draft item itself
    catalogueLine: CatalogueLine;
    // placeholder for the custom property
    newProperty: ItemProperty = ModelUtils.createAdditionalItemProperty(null, null);

    // boolean to indicate whether it's a new publish or an edit
    editCatalogueLine: boolean;


    /*
     * state objects for feedback about the publish operation
     */
    singleItemUpload: boolean = this.isSingleItemUpload();
    private submitted = false;
    private callback = false;
    private error_detc = false;


    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private publishAndAIPCService: PublishAndAIPCService,
                private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        let publishFromScratch: boolean;

        this.route.queryParams.subscribe((params: Params) => {
            publishFromScratch = params['fromScratch'] == "true";
            this.editCatalogueLine = params['edit'] == "true";

            this.initView(publishFromScratch, this.editCatalogueLine);
        });
    }

    private initView(publishFromScratch: boolean, editCatalogueLine: boolean): void {

        // Following "if" block is executed when redirected by an "edit" button
        // "else" block is executed when redirected by "publish" tab
        if (editCatalogueLine) {

            // Initialization
            this.selectedCategories = [];
            let classificationCodes: Code[] = [];
            this.catalogueLine = this.catalogueService.getDraftItem();

            // Get categories of item to edit
            for (let classification of this.catalogueLine.goodsItem.item.commodityClassification)
                classificationCodes.push(classification.itemClassificationCode);

            this.categoryService.getMultipleCategories(classificationCodes).then(
                (categories: Category[]) => {

                    // Then merge existing properties of the item with newly selected properties
                    this.selectedCategories = categories;
                    this.selectedCategories = this.selectedCategories.concat(this.categoryService.getSelectedCategories());

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

                    // Input properties of child component won't update, so force update
                    this.productProperties.catalogueLine = this.catalogueLine;
                    this.productProperties.selectedCategories = this.selectedCategories;
                    this.productProperties.refreshPropertyBlocks();
                });

        }
        else {
            this.catalogueLine = null;
            let userId = this.cookieService.get("user_id");
            this.catalogueService.getCatalogue(userId).then(catalogue => {

                // initiate the goods item with the selected property
                this.selectedCategories = this.categoryService.getSelectedCategories();

                // initiate the "new" goods item if it is not already initiated
                this.catalogueLine = this.catalogueService.getDraftItem();

                if (this.catalogueLine == null || publishFromScratch == true) {
                    this.catalogueLine = ModelUtils.createCatalogueLine(catalogue.providerParty)
                    this.catalogueService.setDraftItem(this.catalogueLine);
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

    // Ensures the user is presented with all properties of the category when editing
    private restoreItemProperties() {
        let newProperties: ItemProperty[] = [];
        let existingProperties: ItemProperty[] = this.catalogueLine.goodsItem.item.additionalItemProperty;
        let customProperties: ItemProperty[] = [];

        // prepare empty category fields
        for (let category of this.selectedCategories) {
            for (let property of category.properties) {
                let aip = ModelUtils.createAdditionalItemProperty(property, category);
                aip.propertyDefinition = property.definition;

                // Make sure each property is pushed once
                if (newProperties.findIndex(p => p.id == property.id) <= -1) {
                    newProperties.push(aip);
                }
            }
        }

        for (let i = 0; i < newProperties.length; i++) {
            for (let j = 0; j < existingProperties.length; j++) {

                // in the first iteration, set aside custom properties
                if (i == 0) {
                    if (existingProperties[j].itemClassificationCode.listID !== "eClass") {
                        customProperties.push(existingProperties[j]);
                    }
                }

                // If a property already exists, copy it over
                if (newProperties[i].id == existingProperties[j].id) {
                    newProperties[i] = existingProperties[j];
                }
            }
        }

        console.log(existingProperties);
        console.log(newProperties);

        newProperties = newProperties.concat(customProperties);
        this.catalogueLine.goodsItem.item.additionalItemProperty = newProperties;
    }

    private updateItemWithNewCategory(category: Category): void {
        let commodityClassification = ModelUtils.createCommodityClassification(category);
        this.catalogueLine.goodsItem.item.commodityClassification.push(commodityClassification);

        loop1:
        for (let property of category.properties) {
            let aip = ModelUtils.createAdditionalItemProperty(property, category);
            // check whether the same property exists already
            for (let existingAip of this.catalogueLine.goodsItem.item.additionalItemProperty) {
                if (aip.id == existingAip.id) {
                    continue loop1;
                }
            }

            this.catalogueLine.goodsItem.item.additionalItemProperty.push(aip);
        }
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
        this.router.navigate(['categorysearch'], {queryParams: {fromScratch: false, edit: this.editCatalogueLine}});
    }

    private publishProduct(): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {

                // remove unused properties from catalogueLine
                let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
                // add new line to the end of catalogue
                catalogue.catalogueLine.push(splicedCatalogueLine);

                // TODO: merge stuff is demo-specific, handle it properly
                //this.mergeMultipleValuesIntoSingleField(catalogue);

                if (catalogue.uuid == null) {
                    this.catalogueService.postCatalogue(catalogue)
                        .then(() => this.onSuccessfulPublish())
                        .catch(() => this.onFailedPublish());

                } else {
                    this.catalogueService.putCatalogue(catalogue)
                        .then(() => this.onSuccessfulPublish())
                        .catch(() => this.onFailedPublish())
                }
            }
        );
    }

    private editProduct(): void {

        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {

                // remove unused properties from catalogueLine
                let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);

                // Replace original line in the catalogue with the edited version
                let indexOfOriginalLine = catalogue.catalogueLine.indexOf(this.catalogueService.getOriginalItem());
                catalogue.catalogueLine[indexOfOriginalLine] = splicedCatalogueLine;

                // TODO: merge stuff is demo-specific, handle it properly
                //this.mergeMultipleValuesIntoSingleField(catalogue);

                if (catalogue.uuid == null) {
                    this.catalogueService.postCatalogue(catalogue)
                        .then(() => this.onSuccessfulPublish())
                        .catch(() => this.onFailedPublish());

                } else {
                    this.catalogueService.putCatalogue(catalogue)
                        .then(() => this.onSuccessfulPublish())
                        .catch(() => this.onFailedPublish())
                }
            }
        );
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
            // ASSUMPTION: if zeroth entry of a property is empty, all entries are
            if (property.value[0] === "") {
                propertiesToBeSpliced.push(property);
            }
        }

        for (let property of propertiesToBeSpliced) {
            properties.splice(properties.indexOf(property), 1);
        }

        return catalogueLineCopy;
    }

    private onSuccessfulPublish(): void {
        // avoid category duplication
        this.categoryService.resetSelectedCategories();

        this.callback = true;
        this.error_detc = false;
        this.ngOnInit();
    }

    private onFailedPublish(): void {
        this.error_detc = true;
    }

    private mergeMultipleValuesIntoSingleField(catalogue: Catalogue): void {
        for (let i: number = 0; i < catalogue.catalogueLine.length; i++) {
            let props = catalogue.catalogueLine[i].goodsItem.item.additionalItemProperty;

            for (let j: number = 0; j < props.length; j++) {
                props[j].demoSpecificMultipleContent = JSON.stringify(props[j].embeddedDocumentBinaryObject);
            }
        }
        //TODO: demo specific handle properly
        catalogue.catalogueLine[0].goodsItem.item.itemConfigurationImages = JSON.stringify(catalogue.catalogueLine[0].goodsItem.item.itemConfigurationImageArray);
    }


    private onValueTypeChange(event: any) {
        if (event.target.value == "Text") {
            this.newProperty.valueQualifier = "STRING";
        } else if (event.target.value == "Number") {
            this.newProperty.valueQualifier = "REAL_MEASURE";
        } else if (event.target.value == "Image" || event.target.valueQualifier == "File") {
            this.newProperty.valueQualifier = "BINARY";
        }
    }

    private imageChange(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.embeddedDocumentBinaryObject;

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
            let binaryObjects = this.newProperty.embeddedDocumentBinaryObject;

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
        let binaryObjects = this.newProperty.embeddedDocumentBinaryObject;

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

    /* deselect a category */
    categoryCancel(categoryId: string) {
        let c = 0;

        let index = this.selectedCategories.findIndex(c => c.id == categoryId);
        if (index > -1) {

            for (let property of this.selectedCategories[index].properties) {
                c = 0;
                for (let category of this.selectedCategories) {
                    if (category.id == categoryId)
                        continue;

                    for (let p of category.properties) {
                        if (property.id == p.id)
                            c++;
                    }
                }
                if (c == 0) {

                    let j = this.catalogueLine.goodsItem.item.additionalItemProperty.findIndex(p => p.id == property.id);
                    if (j > -1)
                        this.catalogueLine.goodsItem.item.additionalItemProperty.splice(j, 1);

                    let k = this.productProperties.renderedPropertyIds.findIndex(p => p == property.id);
                    if (k > -1)
                        this.productProperties.renderedPropertyIds.splice(k, 1);
                }
            }

            this.selectedCategories.splice(index, 1);
        }

        let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.value == categoryId);

        if (i > -1) {
            this.catalogueLine.goodsItem.item.commodityClassification.splice(i, 1);
        }

        this.productProperties.ngOnInit();

    }

    private addCustomProperty(): void {
        this.catalogueLine.goodsItem.item.additionalItemProperty.push(this.newProperty);
        this.productProperties.ngOnInit();

        // reset the custom property view

        this.newProperty = ModelUtils.createAdditionalItemProperty(null, null);
        this.propertyValueType.nativeElement.selectedIndex = 0;
    }

    private downloadTemplate() {
        var reader = new FileReader();
        this.catalogueService.downloadTemplate(this.selectedCategories[0])
            .subscribe(data => {

                    var contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(data);
                    link.download = "template.xlsx";
                    link.click();
                },
                error => console.log("Error downloading the file."),
                () => console.log('Completed file download.'));
    }

    private uploadTemplate(event: any) {
        let catalogueService = this.catalogueService;
        let companyId: string = this.cookieService.get("company_id");
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadTemplate2(userId, file).then(res => {
                        console.log("upload result: " + res);
                    },
                    error => console.log("Error downloading the file."));
            };
            reader.readAsDataURL(file);
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


    private generateUUID(): string {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

}
