import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { ItemProperty } from "../model/publish/item-property";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {sanitizePropertyName, copy, isCustomProperty, getPropertyValues, createText, selectName} from '../../common/utils';
import { Quantity } from "../model/publish/quantity";
import { SelectedProperty } from "../model/publish/selected-property";
import { PROPERTY_TYPES } from "../model/constants";
import {Item} from '../model/publish/item';
import {Text} from '../model/publish/text';
import {LANGUAGES, DEFAULT_LANGUAGE} from '../model/constants';

@Component({
    selector: "edit-property-modal",
    templateUrl: "./edit-property-modal.component.html",
    styleUrls: ["./edit-property-modal.component.css"]
})
export class EditPropertyModalComponent implements OnInit {

    property: ItemProperty;
    selectedProperty: SelectedProperty;

    @ViewChild("modal") modal: ElementRef;

    PROPERTY_TYPES = PROPERTY_TYPES;

    constructor(private modalService: NgbModal) {
    }

    ngOnInit() {

    }

    open(property: ItemProperty, selectedProperty: SelectedProperty, ref: any) {
        this.selectedProperty = selectedProperty;
        this.property = copy(property);
        this.addEmptyValuesToProperty();
        this.modalService.open(this.modal).result.then(() => {
            // on OK, update the property with the values
            property.value = this.property.value;
            property.valueBinary = this.property.valueBinary;
            property.valueDecimal = this.property.valueDecimal;
            property.valueQuantity = this.property.valueQuantity;

            if(isCustomProperty(property)) {
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
        if(this.property.name.length === 0) {
          this.property.name.push(createText(''));
        }
        if(this.property.value.length === 0) {
          if (this.property.valueQualifier == "BOOLEAN") {
              this.property.value.push(createText('false'));
          } else {
              this.property.value.push(createText(''));
          }
        }
        if(this.property.valueDecimal.length === 0) {
            this.property.valueDecimal.push(0);
        }
        if(this.property.valueQuantity.length === 0) {
            this.property.valueQuantity.push(new Quantity());
        }
    }

    selectName (ip: ItemProperty | Item) {
        return selectName(ip);
    }

    getDefinition(): string {
        if(!this.selectedProperty) {
            return "No definition."
        }
        for(const prop of this.selectedProperty.properties) {
            if(prop.definition && prop.definition !== "") {
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
    addPropertyValue() {
      this.property.value.push(createText(''));
    }

    deletePropertyValue(index) {
        this.property.value.splice(index, 1);
    }

    addPropertyName() {
        this.property.name.push(createText(''));
    }

    deletePropertyName(index) {
        this.property.name.splice(index, 1);
    }

    onAddValue() {
        switch(this.property.valueQualifier) {
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
        switch(this.property.valueQualifier) {
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

    setValue(i: number, event: any) {
        this.property.value[i].value = event.target.value;
    }

    setBooleanValue(i: number, event:any) {
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
