import { Component, OnInit, Input } from "@angular/core";
import { LineItem } from "../../../catalogue/model/publish/line-item";

@Component({
    selector: "transport-negotiation-address",
    templateUrl: "./transport-negotiation-address.component.html"
})
export class TransportNegotiationAddressComponent implements OnInit {

    @Input() lineItem: LineItem;
    @Input() disabled: boolean;

    constructor() {
        
    }

    ngOnInit() {
        
    }
}
