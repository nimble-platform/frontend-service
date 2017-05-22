/**
 * Created by suat on 17-May-17.
 */

import {Headers, Http} from "@angular/http";
import {Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import {Category} from "./model/category/category";
import {Property} from "./model/category/property";
import {GoodsItem} from "./model/publish/goods-item";
import {CategoryService} from "./category/category.service";
import {AdditionalItemProperty} from "./model/publish/additional-item-property";
import {Item} from "./model/publish/item";
import {BinaryObject} from "./model/publish/binary-object";

@Component({
    selector: 'product-publish',
    templateUrl: './product-publish.component.html',
})

export class ProductPublishComponent implements OnInit {
    private headers = new Headers({'Accept': 'application/json'});
    // TODO remove the hardcoded URL
    //private url = myGlobals.endpoint;
    private url = `http://localhost:8095/catalogue/category`;
    goodsItem: GoodsItem;
    @ViewChild('propertyValueType') propertyValueType:ElementRef;
    newProperty: AdditionalItemProperty = new AdditionalItemProperty(this.generateUUID(), "", "", new Array<BinaryObject>(), "", "", null, null);

    constructor(private http: Http,
                private categoryService: CategoryService) {
    }

    ngOnInit() {
        // initiate the goods item with the selected property
        let selectedCategory = this.categoryService.getSelectedCategory();

        // create additional item properties
        let additionalItemProperties = new Array<AdditionalItemProperty>();
        for (let i = 0; i < selectedCategory.properties.length; i++) {
            let property = selectedCategory.properties[i];
            let unit = "";
            if (property.unit != null) {
                unit = property.unit.shortName;
            }
            let valueQualifier = property.dataType;
            let aip = new AdditionalItemProperty(property.id, property.preferredName, "", new Array<BinaryObject>(), unit, valueQualifier, null, null);
            additionalItemProperties.push(aip);
        }

        // create item
        let item = new Item("", additionalItemProperties, null);

        // create goods item
        this.goodsItem = new GoodsItem("", item);
    }

    imageChange(event: any) {
        let fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.embeddedDocumentBinaryObjects;

            for(let i=0; i<fileList.length; i++) {
                let file: File = fileList[i];
                let reader = new FileReader();

                reader.onload = function (e: any) {
                    let binaryObject = new BinaryObject("", reader.result, "", "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    fileChange(event: any) {
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
        this.goodsItem.item.additionalItemProperties.push(this.newProperty);

        // reset the custom property view
        this.newProperty = new AdditionalItemProperty(this.generateUUID(), null, "", new Array<BinaryObject>(), "", "", null, null);
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
