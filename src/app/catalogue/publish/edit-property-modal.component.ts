/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ItemProperty } from "../model/publish/item-property";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { sanitizePropertyName, copy, isCustomProperty, getPropertyValues, createText, selectName } from '../../common/utils';
import { Quantity } from "../model/publish/quantity";
import { SelectedProperty } from "../model/publish/selected-property";
import { PROPERTY_TYPES } from "../model/constants";
import { Item } from '../model/publish/item';
import { LANGUAGES } from '../model/constants';
import { TranslateService } from '@ngx-translate/core';
import { Router } from "@angular/router";
import { PublishService } from "../publish-and-aip.service";
import {SinglePublishComponent} from './single-publish.component';

@Component({
    selector: "edit-property-modal",
    templateUrl: "./edit-property-modal.component.html",
    styleUrls: ["./edit-property-modal.component.css"]
})
export class EditPropertyModalComponent implements OnInit {

    orgProperty: ItemProperty;
    property: ItemProperty;
    selectedProperty: SelectedProperty;
    propertyDataType: string;

    @ViewChild("modal") modal: ElementRef;

    PROPERTY_TYPES = PROPERTY_TYPES;

    constructor(
        private publishService: PublishService,
        private router: Router,
        private modalService: NgbModal,
        private translate: TranslateService) {
    }

    ngOnInit() {

    }

    open(property: ItemProperty, selectedProperty: SelectedProperty, ref: any) {
        // property might be null when the publish page is refreshed with searchRef=true parameter
        if (property == null) {
            return;
        }

        this.selectedProperty = selectedProperty;
        this.orgProperty = copy(property);
        this.property = copy(property);
        this.addEmptyValuesToProperty();
        this.setPropertyDataTypeInCaseOfBinaryProperty();
        this.modalService.open(this.modal).result.then(() => {
            // on OK, update the property with the values
            property.value = this.property.value;
            property.valueBinary = this.property.valueBinary;
            property.valueDecimal = this.property.valueDecimal;
            property.valueQuantity = this.property.valueQuantity;

            if (isCustomProperty(property)) {
                property.name = this.property.name;
                property.valueQualifier = this.property.valueQualifier;
            }
            if (ref) {
                //console.log(property.value);
                ref.push(property);
            }
        }, () => {
        });
    }

    addEmptyValuesToProperty() {
        if (this.property.name.length === 0) {
            this.property.name.push(createText(''));
        }
        if (this.property.value.length === 0) {
            if (this.property.valueQualifier == "BOOLEAN") {
                this.property.value.push(createText('false'));
            } else {
                this.property.value.push(createText(''));
            }
        }
        if (this.property.valueDecimal.length === 0) {
            this.property.valueDecimal.push(0);
        }
        if (this.property.valueQuantity.length === 0) {
            this.property.valueQuantity.push(new Quantity());
        }
    }

    // if there is at least one file with an extension different than the image extensions, the property is treated as File, otherwise as Image
    setPropertyDataTypeInCaseOfBinaryProperty(): void {
        if (this.property.valueQualifier == 'FILE') {
            for (let binaryObject of this.property.valueBinary) {
                if (!binaryObject.mimeCode.startsWith("image")) {
                    this.propertyDataType = "File";
                    return;
                }
            }
        }
        this.propertyDataType = "Image";
    }

    resetValues() {
        if (this.property.valueQualifier == this.orgProperty.valueQualifier) {
            this.property.value = this.orgProperty.value;
            this.property.valueBinary = this.orgProperty.valueBinary;
            this.property.valueDecimal = this.orgProperty.valueDecimal;
            this.property.valueQuantity = this.orgProperty.valueQuantity;
        }
        else {
            this.property.value = [];
            this.property.valueBinary = [];
            this.property.valueDecimal = [];
            this.property.valueQuantity = [];
        }
        this.addEmptyValuesToProperty();
    }

    handleOptionChange(event): void {
        this.propertyDataType = event.name;
    }

    selectName(ip: ItemProperty | Item) {
        return selectName(ip);
    }

    getDefinition(): string {
        if (!this.selectedProperty) {
            return "No definition."
        }
        for (const prop of this.selectedProperty.properties) {
            if (prop.definition && prop.definition !== "") {
                return prop.definition;
            }
        }

        return "No definition."
    }

    get prettyName(): string {
        // console.log(' Pretty name: ', sanitizePropertyName(selectName(this.property)));
        return sanitizePropertyName(selectName(this.property));
    }

    set prettyName(name: string) {
        // console.log(' Property: ', this.property);
        this.property.name.push(createText(name));
    }

    getValues(): any[] {
        let values = getPropertyValues(this.property);
        // console.log(' Property Values: ', values);
        return values;
    }

    getNames(): any[] {
        return this.property.name;
    }

    getPropertyPresentationMode(): "edit" | "view" {
        return isCustomProperty(this.property) ? "edit" : "view";
    }

    private languages: Array<string> = LANGUAGES;
    addPropertyName() {
        this.property.name.push(createText(''));
    }

    deletePropertyName(index) {
        this.property.name.splice(index, 1);
    }

    onAddValue() {
        switch (this.property.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
                this.property.valueDecimal.push(0);
                break;
            case "QUANTITY":
                this.property.valueQuantity.push(new Quantity(0, ""));
                break;
            case "STRING":
                this.property.value.push(createText(''));
                break;
            default:
            // BINARY and BOOLEAN: nothing
        }
    }

    onRemoveValue(index: number) {
        switch (this.property.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
                this.property.valueDecimal.splice(index, 1);
                break;
            case "QUANTITY":
                this.property.valueQuantity.splice(index, 1);
                break;
            case "STRING":
                this.property.value.splice(index, 1);
                break;
            default:
            // BINARY and BOOLEAN: nothing
        }
    }

    onAssociateProduct(): void {
        SinglePublishComponent.dialogBox = false;
        this.publishService.itemPropertyLinkedToOtherProducts = this.property;
        this.router.navigate(['/simple-search'], { queryParams: { sTop: 'prod', pageRef: 'publish' } });
    }

    setValue(i: number, event: any) {
        this.property.value[i].value = event.target.value;
    }

    setBooleanValue(i: number, event: any) {
        //console.log(event.target.checked);
        if (event.target.checked)
            this.property.value[i].value = "true";
        else
            this.property.value[i].value = "false";
    }

    setValueDecimal(i: number, event: any) {
        this.property.valueDecimal[i] = event.target.value;
    }
}
