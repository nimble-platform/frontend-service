import {Component, Input} from "@angular/core";
import {LineItem} from "../../../../catalogue/model/publish/line-item";

@Component({
    selector: 'transport-trading-details',
    templateUrl: './transport-trading-details.component.html',
})

export class TransportTradingDetailsComponent {
    @Input() presentationMode:string;
    @Input() lineItem:LineItem;
    @Input() fetchDefaultDeliveryAddress;
}
