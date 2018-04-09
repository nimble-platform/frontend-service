/**
 * Created by suat on 17-May-17.
 */

import {Component, ElementRef, ViewChild} from "@angular/core";
import {CategoryService} from "./category/category.service";
import {ItemProperty} from "./model/publish/item-property";
import {BinaryObject} from "./model/publish/binary-object";
import {CatalogueService} from "./catalogue.service";
import {Category} from "./model/category/category";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {CookieService} from "ng2-cookies";
import {UBLModelUtils} from "./model/ubl-model-utils";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Code} from "./model/publish/code";
import {PublishService} from "./publish-and-aip.service";
import {UserService} from "../user-mgmt/user.service";
import {ItemPropertyDataSourcePipe} from "./item-property-data-source-pipe";
import {Quantity} from "./model/publish/quantity";
import {CallStatus} from "../common/call-status";
import {FormGroup} from "@angular/forms";
import 'file-saver';

const uploadModalityKey: string = "UploadModality";

@Component({
    selector: 'product-publish',
    providers: [ItemPropertyDataSourcePipe],
    templateUrl: './product-publish.component.html',
})

export class ProductPublishComponent {
    @ViewChild('propertyValueType') propertyValueType: ElementRef;

    /*
     * data objects
     */

    // reference to the draft item itself
    private catalogueLine: CatalogueLine = null;
    // placeholder for the custom property
    private newProperty: ItemProperty = UBLModelUtils.createAdditionalItemProperty(null, null);
    // form model to be provided as root model to the inner components used in publishing
    publishForm: FormGroup = new FormGroup({});

    /*
     * state objects for feedback about the publish operation
     */
    publishingGranularity: string;
    submitted = false;
    callback = false;
    error_detc = false;
    // check whether product id conflict exists or not
    sameIdError = false;
    // the value of the erroneousID
    erroneousID = "";

    json = JSON;

    private bulkPublishStatus: CallStatus = new CallStatus();
    private productCategoryRetrievalStatus: CallStatus = new CallStatus();

    // used to add a new property which has a unit
    private quantity = new Quantity(null,null);

    // check whether dialogBox is necessary or not during navigation
    public static dialogBox = true;
    // check whether changing publish-mode to 'create' is necessary or not
    changePublishModeCreate: boolean = false;

    constructor(public categoryService: CategoryService,
                private catalogueService: CatalogueService,
                public publishStateService: PublishService,
                private userService: UserService,
                private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        this.route.queryParams.subscribe((params: Params) => {

            let userId = this.cookieService.get("user_id");
            this.userService.getUserParty(userId).then(party => {
                this.catalogueService.getCatalogue(userId).then(catalogue => {
                    this.initView(party, catalogue);
                    this.publishStateService.publishingStarted = true;
                });
            });

            // handle publishing granularity: single, bulk, null
            this.publishingGranularity = params['pg'];
            if(this.publishingGranularity == null) {
                this.publishingGranularity = 'single';
            }
        });
    }

    canDeactivate():boolean {
        if(this.changePublishModeCreate){
            this.publishStateService.publishMode = 'create';
            this.publishStateService.publishingStarted = false;
        }
        if(ProductPublishComponent.dialogBox){
            let x:boolean = confirm("You will lose any changes you made, are you sure you want to quit ?");
            if(x){
                this.publishStateService.publishMode = 'create';
                this.publishStateService.publishingStarted = false;
            }
            return x;
        }
        ProductPublishComponent.dialogBox = true;
        return true;
    }

    private initView(userParty, userCatalogue): void {
        this.catalogueService.setEditMode(true);
        this.publishStateService.resetData();
        // Following "if" block is executed when redirected by an "edit" button
        // "else" block is executed when redirected by "publish" tab
        let publishMode = this.publishStateService.publishMode;
        if (publishMode == 'edit') {
            this.catalogueLine = this.catalogueService.draftCatalogueLine;
            if (this.catalogueLine == null) {
                this.publishStateService.publishMode = 'create';
                this.router.navigate(['catalogue/publish']);
                return;
            }

            // Get categories of item to edit
            if(this.publishStateService.publishingStarted == false) {
                let classificationCodes: Code[] = [];
                for (let classification of this.catalogueLine.goodsItem.item.commodityClassification) {
                    classificationCodes.push(classification.itemClassificationCode);
                }

                if (classificationCodes.length > 0) {
                    // temporarily store publishing started variable as it will be used inside the following callback
                    this.productCategoryRetrievalStatus.submit();
                    //let publishingModeStarted = this.publishStateService.publishingStarted;
                    this.categoryService.getCategoriesByIds(classificationCodes).then((categories: Category[]) => {
                        // upon navigating from the catalogue view, classification codes are set as selected categories

                        for (let category of categories) {
                            this.categoryService.selectedCategories.push(category);
                        }

                        if (this.categoryService.selectedCategories != []) {
                            for (let category of this.categoryService.selectedCategories) {
                                let newCategory = this.isNewCategory(category);
                                if (newCategory) {
                                    this.updateItemWithNewCategory(category);
                                }
                            }
                        }

                        // Following method is called when editing to make sure the item has
                        // all properties of its categories in the correct order
                        this.restoreItemProperties();
                        this.productCategoryRetrievalStatus.callback('Retrieved product categories', true);
                    }).catch(err =>
                        this.productCategoryRetrievalStatus.error('Failed to get product categories')
                    );
                }

            } else {
                for (let category of this.categoryService.selectedCategories) {
                    let newCategory = this.isNewCategory(category);
                    if (newCategory) {
                        this.updateItemWithNewCategory(category);
                    }
                }
            }

        } else {
            // new publishing is the first entry to the publishing page
            // i.e. publishing from scratch
            if (this.publishStateService.publishingStarted == false) {
                    this.catalogueLine = UBLModelUtils.createCatalogueLine(userCatalogue.uuid, userParty);
                    this.catalogueService.draftCatalogueLine = this.catalogueLine;
            } else {
                this.catalogueLine = this.catalogueService.draftCatalogueLine;
            }

            for (let category of this.categoryService.selectedCategories) {
                let newCategory = this.isNewCategory(category);
                if (newCategory) {
                    this.updateItemWithNewCategory(category);
                }
            }
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
        for (let category of this.categoryService.selectedCategories) {
            for (let property of category.properties) {
                newProperties.push(UBLModelUtils.createAdditionalItemProperty(property, category));
            }
        }

        // gather the custom properties
        for (let i = 0; i < existingProperties.length; i++) {
            if (existingProperties[i].itemClassificationCode.listID == "Custom") {
                customProperties.push(existingProperties[i]);
            }
        }

        // existingProperties contains only non-custom properties now
        existingProperties = existingProperties.filter(function(el){
           return el.itemClassificationCode.listID != "Custom";
        });

        // replace the empty properties with the existing ones
        for (let i = 0; i < newProperties.length; i++) {
            for (let j = 0; j < existingProperties.length; j++) {
                // If a property already exists, copy it over
                if (newProperties[i].id == existingProperties[j].id && newProperties[i].itemClassificationCode.value == existingProperties[j].itemClassificationCode.value) {
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
        for (let property of category.properties) {
            this.catalogueLine.goodsItem.item.additionalItemProperty.push(UBLModelUtils.createAdditionalItemProperty(property, category));
        }
        this.catalogueLine.goodsItem.item.additionalItemProperty = [].concat(this.catalogueLine.goodsItem.item.additionalItemProperty);
    }

    private onTabClick(event: any) {
        event.preventDefault();
        if (event.target.id == "singleUpload") {
            this.publishingGranularity = 'single';
        } else {
            this.publishingGranularity = 'bulk';
        }
    }

	private checkMode(mode: string) {
		if (mode == "replace")
			alert("Beware: All previously published items are deleted and only the new ones are added to the catalogue in replace mode!");
	}

    private addCategoryOnClick(event: any): void {
        ProductPublishComponent.dialogBox = false;
        this.router.navigate(['catalogue/categorysearch'], {queryParams: {pageRef: "publish", pg: this.publishingGranularity}});
    }

    private publishProduct(): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
        // nullify the transportation service details if a regular product is being published
        this.checkProductNature(splicedCatalogueLine);

        if (this.catalogueService.catalogue.uuid == null) {
            // add new line to the end of catalogue
            this.catalogueService.catalogue.catalogueLine.push(splicedCatalogueLine);

            this.catalogueService.postCatalogue(this.catalogueService.catalogue)
                .then(() => this.onSuccessfulPublish())
                .catch(err => {
                    this.catalogueService.catalogue.catalogueLine.pop();
                    this.onFailedPublish(err);
                })
        } else {
            this.catalogueService.addCatalogueLine(this.catalogueService.catalogue.uuid,JSON.stringify(splicedCatalogueLine))
                .then(() => {
                    // add new line to the end of catalogue
                    this.catalogueService.catalogue.catalogueLine.push(splicedCatalogueLine);
                    this.onSuccessfulPublish();
                })
                .catch(err=> this.onFailedPublish(err))
        }
        console.log(this.catalogueService.catalogue);
    }

    private editProduct(): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        // remove unused properties from catalogueLine
        let splicedCatalogueLine: CatalogueLine = this.removeEmptyProperties(this.catalogueLine);
        // nullify the transportation service details if a regular product is being published
        this.checkProductNature(splicedCatalogueLine);

        // Replace original line in the catalogue with the edited version
        let indexOfOriginalLine = this.catalogueService.catalogue.catalogueLine.findIndex(line => line.id === this.catalogueLine.id);
        let originalLine = this.catalogueService.catalogue.catalogueLine[indexOfOriginalLine];
        this.catalogueService.catalogue.catalogueLine[indexOfOriginalLine] = splicedCatalogueLine;

        if (this.catalogueService.catalogue.uuid == null) {
            this.catalogueService.postCatalogue(this.catalogueService.catalogue)
                .then(() => this.onSuccessfulPublish())
                .then(() => this.changePublishModeToCreate())
                .catch(err => {
                    this.catalogueService.catalogue.catalogueLine[indexOfOriginalLine] = originalLine;
                    this.onFailedPublish(err);
                });

        } else {
                this.catalogueService.updateCatalogueLine(this.catalogueService.catalogue.uuid,JSON.stringify(splicedCatalogueLine))
                    .then(() => this.onSuccessfulPublish())
                    .then(() => this.changePublishModeToCreate())
                    .catch(err => {
                        this.catalogueService.catalogue.catalogueLine[indexOfOriginalLine] = originalLine;
                        this.onFailedPublish(err);
                    });
        }
    }

    // changes publishMode to create
    private changePublishModeToCreate():void{
        this.changePublishModeCreate = true;
    }

    private checkProductNature(catalogueLine: CatalogueLine) {
        if(this.publishStateService.publishedProductNature == 'Regular product') {
            catalogueLine.goodsItem.item.transportationServiceDetails = null;
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
            let valueQualifier: string = property.valueQualifier.toLocaleLowerCase();
            if (valueQualifier == "real_measure" ||
                valueQualifier == "int" ||
                valueQualifier == "double" ||
                valueQualifier == "number") {
                property.valueDecimal = property.valueDecimal.filter(function (el){
                    return (el != null && el.toString() != "");
                });
                if (property.valueDecimal.length == 0 || property.valueDecimal[0] == undefined) {
                    propertiesToBeSpliced.push(property);
                }

            } else if (valueQualifier == "binary") {
                if (property.valueBinary.length == 0) {
                    propertiesToBeSpliced.push(property);
                }

            } else if (valueQualifier.toLowerCase() == 'quantity') {
                if (property.valueQuantity.length == 0 || !property.valueQuantity[0].value) {
                    propertiesToBeSpliced.push(property);
                }

            } else {
                if (property.value.length == 0 || property.value[0] == '') {
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
        // since every changes is saved,we do not need a dialog box
        ProductPublishComponent.dialogBox = false;

        let userId = this.cookieService.get("user_id");
        this.userService.getUserParty(userId).then(party => {
            this.catalogueService.getCatalogueForceUpdate(userId, true).then(catalogue => {
                this.catalogueService.catalogue = catalogue;
                this.catalogueLine = UBLModelUtils.createCatalogueLine(catalogue.uuid, party)
                this.catalogueService.draftCatalogueLine = this.catalogueLine;

                // avoid category duplication
                this.categoryService.resetSelectedCategories();
                this.publishStateService.resetData();
                this.router.navigate(['catalogue/catalogue']);

                this.submitted = false;
                this.callback = true;
                this.error_detc = false;
            });
        });
    }

    private onFailedPublish(err): void {
        this.submitted = false;
        this.error_detc = true;
        if(err.status == 406){
            this.sameIdError = true;
            this.erroneousID = this.catalogueLine.id;
        }
        else{
            this.sameIdError = false;
        }
    }


    private onValueTypeChange(event: any) {
        if (event.target.value == "Text") {
            this.newProperty.valueQualifier = "STRING";
        } else if (event.target.value == "Number") {
            this.newProperty.valueQualifier = "REAL_MEASURE";
        } else if (event.target.value == "Image" || event.target.value == "File") {
            this.newProperty.valueQualifier = "BINARY";
        } else if(event.target.value == "Quantity"){
            this.newProperty.valueQualifier = "QUANTITY";
        } else if(event.target.value == "Boolean"){
            this.newProperty.valueQualifier = "BOOLEAN";
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

    /**
     * deselect a category
     * 1) remove the property from additional item properties
     * 2) remove the category from the selected categories
     * 3) remove the corresponding commodity classification from the item
     */
    categoryCancel(category:Category) {
        // custom categories
        if(category.taxonomyId == 'Custom'){
            let index = this.categoryService.selectedCategories.findIndex(c => c.preferredName == category.preferredName);
            if (index > -1) {
                this.catalogueLine.goodsItem.item.additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.filter(function (el) {
                    return el.itemClassificationCode.name != category.preferredName;
                });

                this.categoryService.selectedCategories.splice(index, 1);
            }
            let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.name == category.preferredName);
            if (i > -1) {
                this.catalogueLine.goodsItem.item.commodityClassification.splice(i, 1);
            }
        }
        else{
            let index = this.categoryService.selectedCategories.findIndex(c => c.id == category.id);
            if (index > -1) {
                this.catalogueLine.goodsItem.item.additionalItemProperty = this.catalogueLine.goodsItem.item.additionalItemProperty.filter(function (el) {
                    return el.itemClassificationCode.value != category.id;
                });

                this.categoryService.selectedCategories.splice(index, 1);
            }

            let i = this.catalogueLine.goodsItem.item.commodityClassification.findIndex(c => c.itemClassificationCode.value == category.id);
            if (i > -1) {
                this.catalogueLine.goodsItem.item.commodityClassification.splice(i, 1);
            }
        }
    }

    /**
     * Adds the new property to the end of existing custom properties. Processes the value arrays of the property;
     * keeps only the relevant array based on the value qualifier and removes the empty values
     */
    private addCustomProperty(): void {
        if (this.newProperty.valueQualifier == "BOOLEAN"){
            let filledValues: string[] = [];
            for (let val of this.newProperty.value) {
                if (val != "") {
                    filledValues.push(val);
                }
            }
            this.newProperty.value = filledValues;
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];
        }
        else if (this.newProperty.valueQualifier == "QUANTITY"){
            this.newProperty.value = [];
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [this.quantity];
        }
        // remove empty/undefined values and keep only the the data array relevant to the value qualifier
        else if (this.newProperty.valueQualifier == "STRING") {
            let filledValues: string[] = [];
            for (let val of this.newProperty.value) {
                if (val != "") {
                    filledValues.push(val);
                }
            }

            this.newProperty.value = filledValues;
            this.newProperty.valueDecimal = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];

        } else if (this.newProperty.valueQualifier == "REAL_MEASURE") {
            let filledValues: number[] = [];
            for (let val of this.newProperty.valueDecimal) {
                if (val != undefined && val != null && val.toString() != "") {
                    filledValues.push(val);
                }
            }

            this.newProperty.valueDecimal = filledValues;
            this.newProperty.value = [];
            this.newProperty.valueBinary = [];
            this.newProperty.valueQuantity = [];

        } else if (this.newProperty.valueQualifier == "BINARY") {
            this.newProperty.value = [];
            this.newProperty.valueDecimal = [];
            this.newProperty.valueQuantity = [];

        }

        // add the custom property to the end of existing custom properties
        let i = 0;
        for (i = 0; i < this.catalogueLine.goodsItem.item.additionalItemProperty.length; i++) {
            if (this.catalogueLine.goodsItem.item.additionalItemProperty[i].itemClassificationCode.listID != "Custom") {
                break;
            }
        }
        this.catalogueLine.goodsItem.item.additionalItemProperty.splice(i, 0, this.newProperty);
        this.catalogueLine.goodsItem.item.additionalItemProperty = [].concat(this.catalogueLine.goodsItem.item.additionalItemProperty);

        // reset the custom property view
        this.newProperty = UBLModelUtils.createAdditionalItemProperty(null, null);
        this.quantity = new Quantity(null,null);
        this.propertyValueType.nativeElement.selectedIndex = 0;

    }

    private downloadTemplate() {
        this.bulkPublishStatus.submit();

        let userId: string = this.cookieService.get("user_id");
        var reader = new FileReader();
        this.catalogueService.downloadTemplate(userId, this.categoryService.selectedCategories)
            .then(result => {
                    var link = document.createElement('a');
                    link.id = 'downloadLink';
                    link.href = window.URL.createObjectURL(result.content);
                    link.download = result.fileName;

                    document.body.appendChild(link);
                    var downloadLink = document.getElementById('downloadLink');
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    this.bulkPublishStatus.callback("Download completed");
                },
                error => {
                    this.bulkPublishStatus.error("Download failed");
                });
    }

    private uploadTemplate(event: any, uploadMode: string) {
        this.bulkPublishStatus.submit();
        let catalogueService = this.catalogueService;
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadTemplate(userId, file, uploadMode).then(res => {
                        self.bulkPublishStatus.callback(null);
                        ProductPublishComponent.dialogBox = false;
                        self.router.navigate(['catalogue/catalogue'], {queryParams: {forceUpdate: true}});
                    },
                    error => {
                        self.bulkPublishStatus.error("Failed to upload the template:  " + error);
                    });
            };
            reader.readAsDataURL(file);
        }
    }

    private uploadImagePackage(event: any): void {
        this.bulkPublishStatus.submit();
        let catalogueService = this.catalogueService;
        let userId: string = this.cookieService.get("user_id");
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let file: File = fileList[0];
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // reset the target value so that the same file could be chosen more than once
                event.target.value = "";
                catalogueService.uploadZipPackage(file).then(res => {
                        self.bulkPublishStatus.callback(null);
                        ProductPublishComponent.dialogBox = false;
                        self.router.navigate(['catalogue/catalogue'], {queryParams: {forceUpdate: true}});
                    },
                    error => {
                        self.bulkPublishStatus.error("Failed to upload the image package:  " + error);
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
					var data = result.content;
					var fileName = result.fileName;
					var blob = new Blob([data],{type:contentType});
					saveAs(blob,fileName);
                    this.bulkPublishStatus.callback("Download completed");
                },
                error => {
                    this.bulkPublishStatus.error("Download failed");
                });
    }

    /**
     * Used to establish the two-way binding on the additional values of custom properties
     */
    trackByIndex(index: any, item: any) {
        return index;
    }

    addValueToProperty() {
        if (this.newProperty.valueQualifier == 'STRING') {
            this.newProperty.value.push('');
        } else if (this.newProperty.valueQualifier == 'REAL_MEASURE') {
            let newNumber: number;
            this.newProperty.valueDecimal.push(newNumber);
        }
    }

    removeValueFromProperty(valueIndex: number): void {
        if (this.newProperty.valueQualifier == 'STRING') {
            this.newProperty.value.splice(valueIndex, 1)
        } else if (this.newProperty.valueQualifier == 'REAL_MEASURE') {
            this.newProperty.valueDecimal.splice(valueIndex, 1)
        }
    }

    private isNewCategory(category: Category): boolean {
        let newCategory: boolean = true;
        // custom categories
        if(category.taxonomyId == 'Custom'){
            for (let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification) {
                if (category.preferredName == commodityClassification.itemClassificationCode.name) {
                    newCategory = false;
                    break;
                }
            }
        }
        else{
            for (let commodityClassification of this.catalogueLine.goodsItem.item.commodityClassification) {
                if (category.id == commodityClassification.itemClassificationCode.value) {
                    newCategory = false;
                    break;
                }
            }
        }
        return newCategory;
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}
