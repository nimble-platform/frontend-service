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
    i: Array<string> = [];
    c: number = 1;

    @Input() additionalItemProperty:ItemProperty;

    stringValue:boolean = true;
    binaryValue:boolean = false;

    eClassValue:boolean = false;

    propertyUnitDefined:boolean = false;

    buttonDisabled: boolean = true;

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

    addAnotherPropertyValue(aipName: string) {

        console.log(this.i.length);
        let d = this.generateUUID();
        this.i.push(d);
        this.c++;
        console.log(this.i);

        this.buttonDisabled = true;

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
     this.buttonEnabledOrDisabled();

    }

    buttonEnabledOrDisabled() {
        let n = 0;
        for (; n < this.c; n++) {
            console.log(!this.additionalItemProperty.value[n]);
            if(!this.additionalItemProperty.value[n] || this.additionalItemProperty.value[n].length==0){
                break;
            }
        }
        if(n==this.c){
            this.buttonDisabled = false;
        } else {
            this.buttonDisabled = true;
        }
    }

    removeAddedValue(index: number) {
        if(index==0){
            this.additionalItemProperty.value.splice(index, 1);
            this.i.splice(index, 1);
            this.c--;
        } else {
            console.log(index);
            this.i.splice(index-1, 1);
            this.additionalItemProperty.value.splice(index, 1);
            this.c--;
            console.log(this.additionalItemProperty.value);
        }
        this.buttonEnabledOrDisabled();
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
    deleteCustomProperty = function (inputVal: string) {
        // calls deleteProperty method in the shared service
        this._publishAndAIPCService.deleteProperty(inputVal);
    }

}
