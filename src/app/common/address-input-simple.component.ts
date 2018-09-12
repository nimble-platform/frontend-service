import { Component, OnInit, Input } from "@angular/core";
import { AddressSimple } from "../catalogue/model/publish/address-simple";

@Component({
    selector: "address-input-simple",
    templateUrl: "./address-input-simple.component.html",
    styleUrls: ["./address-input-simple.component.css"]
})
export class AddressInputSimpleComponent implements OnInit {

    @Input() address: AddressSimple = new AddressSimple();
    @Input() disabled: boolean = false;
    
    constructor(

    ) { }

    ngOnInit() {

    }

}
