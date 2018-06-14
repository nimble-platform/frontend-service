import { Component, OnInit } from "@angular/core";
import { Address } from "../../../catalogue/model/publish/address";

@Component({
    selector: "negotiation-response",
    templateUrl: "./negotiation-response.component.html",
    styleUrls: ["./negotiation-response.component.css"],
})
export class NegotiationResponseComponent implements OnInit {

    address: Address = new Address();

    constructor() { }

    ngOnInit() {
        
    }
}
