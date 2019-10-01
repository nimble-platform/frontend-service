import { Component, OnInit, Input } from "@angular/core";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import {TranslateService} from '@ngx-translate/core';
@Component({
    selector: "transport-negotiation-address",
    templateUrl: "./transport-negotiation-address.component.html"
})
export class TransportNegotiationAddressComponent implements OnInit {

    @Input() lineItem: LineItem;
    @Input() disabled: boolean;

    constructor( private translate: TranslateService) {
    }

    ngOnInit() {

    }
}
