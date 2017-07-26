/**
 * Created by suat on 18-May-17.
 */
import {Component, Input, OnInit} from "@angular/core";
import {ItemProperty} from "./model/publish/item-property";
import {PublishAndAIPCService} from "./publish-and-aip.service";

@Component({
    selector: 'additional-item-property',
    templateUrl: './additional-item-property.component.html'
})

export class AdditionalItemPropertyComponent implements OnInit {
    @Input() additionalItemProperty:ItemProperty;

    stringValue:boolean = true;
    binaryValue:boolean = false;

    eClassValue:boolean = false;

    propertyUnitDefined:boolean = false;

    openModal(): void {
        //if(this.eClassValue == true){
            let modal = document.getElementById('myModal');

            let header = document.getElementById('header');
            header.innerText = this.additionalItemProperty.name;

            let prop_def = document.getElementById('prop_def');
            prop_def.innerText = this.additionalItemProperty.propertyDefinition;

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
       // }
    }

    spanClose() {
    let modal = document.getElementById('myModal');

    modal.style.display = "none";
}
    

    constructor(
        private _publishAndAIPCService: PublishAndAIPCService) { }

    ngOnInit(): void {
        if(this.additionalItemProperty.embeddedDocumentBinaryObject.length != 0) {
            this.stringValue = false;
            this.binaryValue = true;
        }
        if(this.additionalItemProperty.itemClassificationCode.listID == "Custom") {
            this.eClassValue = false;
        }
        if(this.additionalItemProperty.itemClassificationCode.listID == "eClass") {
            this.eClassValue = true;
        }
        if(this.additionalItemProperty.unit && this.additionalItemProperty.unit.length > 0) {
            this.propertyUnitDefined = true;
        }
    }

    // deletes the custom property with the given name
    deleteCustomProperty = function (inputVal: string) {
        // calls deleteProperty method in the shared service
        this._publishAndAIPCService.deleteProperty(inputVal);
    }

}
