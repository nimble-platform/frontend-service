import { Component, OnInit, Input } from "@angular/core";
import { Address } from "../catalogue/model/publish/address";
import { PresentationMode } from "../catalogue/model/publish/presentation-mode";

@Component({
    selector: "address-input",
    templateUrl: "./address-input.component.html",
    styleUrls: ["./address-input.component.css"]
})
export class AddressInputComponent implements OnInit {

    @Input() address: Address = new Address();
    @Input() presentationMode: PresentationMode = "edit";
    @Input() disabled: boolean = false;
    
    constructor(

    ) { }

    ngOnInit() {

    }

}
