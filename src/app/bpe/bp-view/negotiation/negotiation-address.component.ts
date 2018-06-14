import { Component, OnInit, Input } from "@angular/core";
import { Address } from "../../../catalogue/model/publish/address";

@Component({
    selector: "negotiation-address",
    templateUrl: "./negotiation-address.component.html",
    styleUrls: ["./negotiation-address.component.css"]
})
export class NegotiationAddressComponent implements OnInit {

    @Input() address: Address = new Address();
    @Input() disabled: boolean = false;
    
    constructor(

    ) { }

    ngOnInit() {

    }

}
