/**
 * Created by suat on 17-May-17.
 */

import {Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import {CategoryService} from "./category/category.service";
import {AdditionalItemProperty} from "./model/publish/additional-item-property";
import {BinaryObject} from "./model/publish/binary-object";
import {CatalogueService} from "./catalogue.service";
import {Category} from "./model/category/category";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Catalogue} from "./model/publish/catalogue";
import {CookieService} from "ng2-cookies";
import {ModelUtils} from "./model/model-utils";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ProductPropertiesComponent} from "./product-properties.component";
import 'rxjs/Rx' ;

const uploadModalityKey: string = "UploadModality";

@Component({
    selector: 'product-publish',
    templateUrl: './product-publish.component.html'
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
    newProperty: AdditionalItemProperty = ModelUtils.createAdditionalItemProperty(null, "Custom");

    /*
     * state objects for feedback about the publish operation
     */
    singleItemUpload: boolean = this.isSingleItemUpload();
    private submitted = false;
    private callback = false;
    private error_detc = false;

    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private router: Router,
                private route: ActivatedRoute,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        let publishFromScratch: boolean;
        this.route.queryParams.subscribe((params: Params) => {
            publishFromScratch = params['fromScratch'] == "true";
            this.initView(publishFromScratch);
        });
    }

    private initView(publishFromScratch: boolean): void {
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

    private updateItemWithNewCategory(category: Category): void {
        let commodityClassification = ModelUtils.createCommodityClassification(category);
        this.catalogueLine.goodsItem.item.commodityClassification.push(commodityClassification);

        for (let property of category.properties) {
            let aip = ModelUtils.createAdditionalItemProperty(property, category.taxonomyId);
            // check whether the same property exists already
            for (let existingAip of this.catalogueLine.goodsItem.item.additionalItemProperty) {
                if (aip.id == existingAip.id) {
                    break;
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
        this.router.navigate(['categorysearch'], {queryParams: {fromScratch: false}});
    }

    private publishProduct(): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {
                catalogue.catalogueLine.push(this.catalogueLine);

                // TODO: merge stuff is demo-specific, handle it properly
                this.mergeMultipleValuesIntoSingleField(catalogue);

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

    private onSuccessfulPublish(): void {
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
            let file: File = fileList[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                // get loaded data and render thumbnail.
                document.getElementById('img').setAttribute("src", reader.result);
            };
            reader.readAsDataURL(file);
        }
    }

    private addCustomProperty(): void {
        this.catalogueLine.goodsItem.item.additionalItemProperty.push(this.newProperty);
        this.productProperties.ngOnInit();

        // reset the custom property view

        this.newProperty = ModelUtils.createAdditionalItemProperty(null, "Custom");
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
