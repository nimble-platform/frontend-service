import { Component, OnInit, Input } from "@angular/core";
import { LineItem } from "../../../catalogue/model/publish/line-item";
import {TranslateService} from '@ngx-translate/core';
import {DeliveryTerms} from '../../../user-mgmt/model/delivery-terms';
@Component({
    selector: "transport-negotiation-address",
    templateUrl: "./transport-negotiation-address.component.html"
})
export class TransportNegotiationAddressComponent implements OnInit {

    @Input() lineItem: LineItem;
    @Input() disabled: boolean;
    @Input() deliveryTerms: DeliveryTerms[] = null;

    constructor( private translate: TranslateService) {
    }

    ngOnInit() {

    }
}
