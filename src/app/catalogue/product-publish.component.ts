/**
 * Created by suat on 17-May-17.
 */

import {Http} from "@angular/http";
import {Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import {GoodsItem} from "./model/publish/goods-item";
import {CategoryService} from "./category/category.service";
import {AdditionalItemProperty} from "./model/publish/additional-item-property";
import {Item} from "./model/publish/item";
import {BinaryObject} from "./model/publish/binary-object";
import {CatalogueService} from "./catalogue.service";
import {Category} from "./model/category/category";
import {Identifier} from "./model/publish/identifier";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Catalogue} from "./model/publish/catalogue";
import {CookieService} from "ng2-cookies";

@Component({
    selector: 'product-publish',
    templateUrl: './product-publish.component.html'
})

export class ProductPublishComponent implements OnInit {
    @ViewChild('propertyValueType') propertyValueType: ElementRef;

    // data objects
    selectedCategory: Category;
    goodsItem: GoodsItem;
    newProperty: AdditionalItemProperty = new AdditionalItemProperty("", [''], new Array<BinaryObject>(), "", "", "STRING", null, null);

    // state objects
    singleItemUpload: boolean = true;
    private submitted = false;
    private callback = false;
    private error_detc = false;

    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {

            // initiate the goods item with the selected property
            this.selectedCategory = this.categoryService.getSelectedCategory();

            // create additional item properties
            let additionalItemProperties = new Array<AdditionalItemProperty>();
            // create item
            let item = new Item("", "", additionalItemProperties, catalogue.providerParty, [], "");
            // identifier
            let giId = new Identifier(this.generateUUID(), "", "");
            // create goods item
            this.goodsItem = new GoodsItem(giId, item);

            if (this.selectedCategory != null) {
                for (let i = 0; i < this.selectedCategory.properties.length; i++) {
                    let property = this.selectedCategory.properties[i];
                    let unit = "";
                    if (property.unit != null) {
                        unit = property.unit.shortName;
                    }
                    let valueQualifier = property.dataType;
                    let aip = new AdditionalItemProperty(property.preferredName, [''], new Array<BinaryObject>(), "", unit, valueQualifier, null, null);
                    additionalItemProperties.push(aip);
                }
            }
        });
    }

    private onTabClick(event: any) {
        event.preventDefault();
        if (event.target.id == "singleUpload") {
            this.singleItemUpload = true;
        } else {
            this.singleItemUpload = false;
        }
    }

    private publishProduct(): void {
        this.error_detc = false;
        this.callback = false;
        this.submitted = true;

        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {
                let line: CatalogueLine = new CatalogueLine(null, this.goodsItem);
                catalogue.catalogueLine.push(line);
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

    private onSuccessfulPublish():void {
        this.callback = true;
        this.error_detc = false;
        this.ngOnInit();
    }

    private onFailedPublish():void {
        this.error_detc = true;
    }

    private mergeMultipleValuesIntoSingleField(catalogue: Catalogue): void {
        for (let i: number = 0; i < catalogue.catalogueLine.length; i++) {
            let props = catalogue.catalogueLine[i].goodsItem.item.additionalItemProperty;

            for (let j: number = 0; j < props.length; j++) {
                props[j].demoSpecificMultipleContent = JSON.stringify(props[j].embeddedDocumentBinaryObject);
            }
        }
        //demo specific
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
        console.log(event.target.selectedIndex);
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
            let itemConfigurationImageArray = this.goodsItem.item.itemConfigurationImageArray;
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
        this.goodsItem.item.additionalItemProperty.push(this.newProperty);

        // reset the custom property view
        this.newProperty = new AdditionalItemProperty(null, [''], new Array<BinaryObject>(), "", "", "STRING", null, null);
        this.propertyValueType.nativeElement.selectedIndex = 0;
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
