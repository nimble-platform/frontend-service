import { Component, OnInit, Input } from "@angular/core";
import { Address } from "../catalogue/model/publish/address";

@Component({
    selector: "address-input",
    templateUrl: "./address-input.component.html",
    styleUrls: ["./address-input.component.css"]
})
export class AddressInputComponent implements OnInit {

    @Input() address: Address = new Address();
    @Input() disabled: boolean = false;
    
    constructor(

    ) { }

    ngOnInit() {

    }

}
