import {Component, Input} from "@angular/core";
import { CatalogueLine } from "../../../catalogue/model/publish/catalogue-line";
import {LineItem} from "../../../catalogue/model/publish/line-item";
import {DeliveryTerms} from "../../../catalogue/model/publish/delivery-terms";
import {PaymentMeans} from '../../../catalogue/model/publish/payment-means';
import {PaymentTerms} from '../../../catalogue/model/publish/payment-terms';

@Component({
    selector: 'transport-trading-details',
    templateUrl: './transport-trading-details.component.html',
})

export class TransportTradingDetailsComponent {
    @Input() presentationMode:string;
    @Input() lineItem:LineItem;
    @Input() fetchDefaultDeliveryAddress;
    @Input() paymentTerms:PaymentTerms;
    @Input() paymentMeans:PaymentMeans;
}
