import {Component, Input} from "@angular/core";
import {LineItem} from "../../../../catalogue/model/publish/line-item";

@Component({
    selector: 'negotiation-trading-details',
    templateUrl: './negotiation-trading-details.component.html',
})

export class NegotiationTradingDetailsComponent {
    @Input() presentationMode:string;
    @Input() lineItem:LineItem;
    @Input() fetchDefaultDeliveryAddress;
}
