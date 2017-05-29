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

@Component({
    selector: 'product-publish',
    templateUrl: './product-publish.component.html',
})

export class ProductPublishComponent implements OnInit {
    @ViewChild('propertyValueType') propertyValueType: ElementRef;

    selectedCategory: Category;
    singleItemUpload: boolean = true;
    goodsItem: GoodsItem;
    newProperty: AdditionalItemProperty = new AdditionalItemProperty("", [''], new Array<BinaryObject>(), "", "Text", null, null);

    constructor(private categoryService: CategoryService,
                private catalogueService: CatalogueService) {
    }

    ngOnInit() {
        // initiate the goods item with the selected property
        this.selectedCategory = this.categoryService.getSelectedCategory();

        // create additional item properties
        let additionalItemProperties = new Array<AdditionalItemProperty>();
        // create item
        let item = new Item("", additionalItemProperties, null);
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
                let aip = new AdditionalItemProperty(property.preferredName, [''], new Array<BinaryObject>(), unit, valueQualifier, null, null);
                additionalItemProperties.push(aip);
            }
        }
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
        this.catalogueService.getCatalogue().then(catalogue => {
                let line: CatalogueLine = new CatalogueLine(null, this.goodsItem);
                catalogue.catalogueLine.push(line);
                this.catalogueService.postCatalogue(catalogue);
                //this.catalogueService.publishProduct(this.goodsItem);
            }
        );
    }


    private onValueTypeChange(event: any) {
        if (event.target.value == "Text") {
            this.newProperty.valueQualifier = "Text";
        } else if (event.target.value == "Number") {
            this.newProperty.valueQualifier = "Number";
        } else if (event.target.value == "Image" || event.target.valueQualifier == "File") {
            this.newProperty.valueQualifier = "Binary";
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
                    let binaryObject = new BinaryObject(base64String, file.type, "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
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
        this.newProperty = new AdditionalItemProperty(null, [''], new Array<BinaryObject>(), "", "", null, null);
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
