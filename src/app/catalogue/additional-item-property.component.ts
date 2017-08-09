/**
 * Created by suat on 18-May-17.
 */
import {Component, Input, OnInit} from "@angular/core";
import {ItemProperty} from "./model/publish/item-property";
import {PublishService} from "./publish-and-aip.service";
import {CatalogueService} from "./catalogue.service";

@Component({
    selector: 'additional-item-property',
    templateUrl: './additional-item-property.component.html'
})

export class AdditionalItemPropertyComponent implements OnInit {
    propertyAdditionalValueIndices: Array<string> = [];
    customPropertyValueCount: number = 1;

    @Input() additionalItemProperty:ItemProperty;

    stringValue:boolean = true;
    binaryValue:boolean = false;

    customProperty:boolean = false;
    propertyUnitDefined:boolean = false;
    addValueButtonDisabled: boolean = true;

    openPropertyDetails(): void {
            let modal = document.getElementById('myModal');

            let header = document.getElementById('header');
            header.innerText = this.additionalItemProperty.name;

            let prop_def = document.getElementById('prop_def');
            //TODO retrieve the property definition from the actual property objects
            //prop_def.innerText = this.additionalItemProperty.propertyDefinition;

            if(this.propertyUnitDefined == true) {
                let prop_unit = document.getElementById('prop_unit');
                prop_unit.innerText = this.additionalItemProperty.unit;

                let unit_label = document.getElementById('unit_label');
                unit_label.innerText = "Unit: ";
            }
            else {
                let prop_unit = document.getElementById('prop_unit');
                prop_unit.innerText = "";

                let unit_label = document.getElementById('unit_label');
                unit_label.innerText = "";
            }

            modal.style.display = "block";
    }

    addValueToProperty(aipName: string) {
        let valueId = this.generateUUID();
        this.propertyAdditionalValueIndices.push(valueId);
        this.customPropertyValueCount++;
        this.addValueButtonDisabled = true;
    }

    constructor(
        private catalogueService: CatalogueService,
        private publishAndAIPCService: PublishService) { }

    ngOnInit(): void {
        if(this.additionalItemProperty.valueBinary.length != 0) {
            this.stringValue = false;
            this.binaryValue = true;
        }
        if(this.additionalItemProperty.itemClassificationCode.listID == "Custom") {
            this.customProperty = true;
        }
        if(this.additionalItemProperty.unit && this.additionalItemProperty.unit.length > 0) {
            this.propertyUnitDefined = true;
        }
     this.buttonEnabledOrDisabled();

    }

    buttonEnabledOrDisabled() {
        let n = 0;
        for (; n < this.customPropertyValueCount; n++) {
            if(!this.additionalItemProperty.value[n] || this.additionalItemProperty.value[n].length==0){
                break;
            }
        }
        if(n==this.customPropertyValueCount){
            this.addValueButtonDisabled = false;
        } else {
            this.addValueButtonDisabled = true;
        }
    }

    removeAddedValue(index: number) {
        if(index==0){
            this.additionalItemProperty.value.splice(index, 1);
            this.propertyAdditionalValueIndices.splice(index, 1);
            this.customPropertyValueCount--;
        } else {
            this.propertyAdditionalValueIndices.splice(index-1, 1);
            this.additionalItemProperty.value.splice(index, 1);
            this.customPropertyValueCount--;
        }
        this.buttonEnabledOrDisabled();
    }

    //remove a value from displayed custom property
    removeCustomValue(index: number) {
        this.additionalItemProperty.value.splice(index, 1);

        // if the property no longer has a value, delete it
        if(this.additionalItemProperty.value.length == 0){
            this.deleteCustomProperty(this.additionalItemProperty.name);
        }
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

    // deletes the custom property with the given name
    deleteCustomProperty(inputVal: string) {
        let draftCatalogueLine = this.catalogueService.getDraftItem();
        let indexCatalogue = draftCatalogueLine.goodsItem.item.additionalItemProperty.findIndex(p => p.name == inputVal);
        draftCatalogueLine.goodsItem.item.additionalItemProperty.splice(indexCatalogue, 1);

        // calls deleteProperty method in the shared service
        //this.publishAndAIPCService.deleteProperty(inputVal);

    }

}
