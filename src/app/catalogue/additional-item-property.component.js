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
/**
 * Created by suat on 18-May-17.
 */
const core_1 = require("@angular/core");
const additional_item_property_1 = require("./model/publish/additional-item-property");
let AdditionalItemPropertyComponent = class AdditionalItemPropertyComponent {
    constructor() {
        this.stringValue = true;
        this.binaryValue = false;
    }
    ngOnInit() {
        if (this.additionalItemProperty.embeddedDocumentBinaryObjects.length != 0) {
            this.stringValue = false;
            this.binaryValue = true;
        }
    }
};
__decorate([
    core_1.Input(), 
    __metadata('design:type', additional_item_property_1.AdditionalItemProperty)
], AdditionalItemPropertyComponent.prototype, "additionalItemProperty", void 0);
AdditionalItemPropertyComponent = __decorate([
    core_1.Component({
        selector: 'additional-item-property',
        templateUrl: './additional-item-property.component.html'
    }), 
    __metadata('design:paramtypes', [])
], AdditionalItemPropertyComponent);
exports.AdditionalItemPropertyComponent = AdditionalItemPropertyComponent;
//# sourceMappingURL=additional-item-property.component.js.map