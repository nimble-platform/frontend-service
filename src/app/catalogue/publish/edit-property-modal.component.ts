import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { ItemProperty } from "../model/publish/item-property";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { sanitizePropertyName, copy } from "../../common/utils";
import { Quantity } from "../model/publish/quantity";
import { SelectedProperty } from "../model/publish/selected-property";

@Component({
    selector: "edit-property-modal",
    templateUrl: "./edit-property-modal.component.html",
    styleUrls: ["./edit-property-modal.component.css"]
})
export class EditPropertyModalComponent implements OnInit {

    property: ItemProperty;
    selectedProperty: SelectedProperty;
    
    @ViewChild("modal") modal: ElementRef;

    constructor(private modalService: NgbModal) {
    }

    ngOnInit() {

    }

    open(property: ItemProperty, selectedProperty: SelectedProperty) {
        this.selectedProperty = selectedProperty;
        this.property = copy(property);
        this.modalService.open(this.modal).result.then(() => {
            // on OK, update the property with the values
            property.value = this.property.value;
            property.valueBinary = this.property.valueBinary;
            property.valueDecimal = this.property.valueDecimal;
            property.valueQuantity = this.property.valueQuantity;
        })
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

    getPrettyName(): string {
        return sanitizePropertyName(this.property.name);
    }

    getValues(): any[] {
        switch(this.property.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
            case "REAL_MEASURE":
                return this.property.valueDecimal;
            case "BINARY":
                return this.property.valueBinary;
            case "QUANTITY":
                return this.property.valueQuantity;
            case "STRING":
            case "BOOLEAN":
                return this.property.value;
        }
    }

    onAddValue() {
        switch(this.property.valueQualifier) {
            case "INT":
            case "DOUBLE":
            case "NUMBER":
            case "REAL_MEASURE":
                this.property.valueDecimal.push(0);
                break;
            case "QUANTITY":
                this.property.valueQuantity.push(new Quantity(0, ""));
                break;
            case "STRING":
                this.property.value.push("");
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
            case "REAL_MEASURE":
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
        this.property.value[i] = event.target.value;
    }

    setValueDecimal(i: number, event: any) {
        this.property.valueDecimal[i] = event.target.value;
    }
}
