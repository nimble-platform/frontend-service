import { Component, OnInit, Input } from "@angular/core";
import { Address } from "../catalogue/model/publish/address";
import { UBLModelUtils } from "../catalogue/model/ubl-model-utils";


@Component({
    selector: "multi-address-input",
    templateUrl: "./multi-address-input.component.html",
    styleUrls: ["./multi-address-input.component.css"],
})

export class MultiAddressInputComponent implements OnInit {
    @Input() address: Address[];
    @Input() label: string;
    @Input() multiValue: boolean = true;

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() valueTextClass: string = "";

    constructor(

    ) { }

    ngOnInit() {
        if(this.address.length === 0) {
            this.address.push(new Address());
        }
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    addNewValue():void {
        let value:Address = UBLModelUtils.createAddress();
        this.address.push(value);
    }

    removeValue(index:number):void {
        this.address.splice(index, 1);
    }

}
