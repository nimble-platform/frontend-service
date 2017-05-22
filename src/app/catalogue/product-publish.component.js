/**
 * Created by suat on 17-May-17.
 */
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const http_1 = require("@angular/http");
const core_1 = require("@angular/core");
const goods_item_1 = require("./model/publish/goods-item");
const category_service_1 = require("./category/category.service");
const additional_item_property_1 = require("./model/publish/additional-item-property");
const item_1 = require("./model/publish/item");
const binary_object_1 = require("./model/publish/binary-object");
let ProductPublishComponent = class ProductPublishComponent {
    constructor(http, categoryService) {
        this.http = http;
        this.categoryService = categoryService;
        this.headers = new http_1.Headers({ 'Accept': 'application/json' });
        // TODO remove the hardcoded URL
        //private url = myGlobals.endpoint;
        this.url = `http://localhost:8095/catalogue/category`;
        this.newProperty = new additional_item_property_1.AdditionalItemProperty(this.generateUUID(), "", "", new Array(), "", "", null, null);
    }
    ngOnInit() {
        // initiate the goods item with the selected property
        let selectedCategory = this.categoryService.getSelectedCategory();
        // create additional item properties
        let additionalItemProperties = new Array();
        for (let i = 0; i < selectedCategory.properties.length; i++) {
            let property = selectedCategory.properties[i];
            let unit = "";
            if (property.unit != null) {
                unit = property.unit.shortName;
            }
            let valueQualifier = property.dataType;
            let aip = new additional_item_property_1.AdditionalItemProperty(property.id, property.preferredName, "", new Array(), unit, valueQualifier, null, null);
            additionalItemProperties.push(aip);
        }
        // create item
        let item = new item_1.Item("", additionalItemProperties, null);
        // create goods item
        this.goodsItem = new goods_item_1.GoodsItem("", item);
    }
    imageChange(event) {
        let fileList = event.target.files;
        if (fileList.length > 0) {
            let binaryObjects = this.newProperty.embeddedDocumentBinaryObjects;
            for (let i = 0; i < fileList.length; i++) {
                let file = fileList[i];
                let reader = new FileReader();
                reader.onload = function (e) {
                    let binaryObject = new binary_object_1.BinaryObject("", reader.result, "", "");
                    binaryObjects.push(binaryObject);
                };
                reader.readAsDataURL(file);
            }
        }
    }
    fileChange(event) {
        let fileList = event.target.files;
        if (fileList.length > 0) {
            let file = fileList[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                // get loaded data and render thumbnail.
                document.getElementById('img').setAttribute("src", reader.result);
            };
            reader.readAsDataURL(file);
        }
    }
    addCustomProperty() {
        this.goodsItem.item.additionalItemProperties.push(this.newProperty);
        // reset the custom property view
        this.newProperty = new additional_item_property_1.AdditionalItemProperty(this.generateUUID(), null, "", new Array(), "", "", null, null);
        this.propertyValueType.nativeElement.selectedIndex = 0;
    }
    handleError(error) {
        return Promise.reject(error.message || error);
    }
    generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
    ;
};
__decorate([
    core_1.ViewChild('propertyValueType'), 
    __metadata('design:type', core_1.ElementRef)
], ProductPublishComponent.prototype, "propertyValueType", void 0);
ProductPublishComponent = __decorate([
    core_1.Component({
        selector: 'product-publish',
        templateUrl: './product-publish.component.html',
    }), 
    __metadata('design:paramtypes', [http_1.Http, category_service_1.CategoryService])
], ProductPublishComponent);
exports.ProductPublishComponent = ProductPublishComponent;
//# sourceMappingURL=product-publish.component.js.map