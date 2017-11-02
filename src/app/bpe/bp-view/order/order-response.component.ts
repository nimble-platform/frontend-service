import {Component, Input} from "@angular/core";
import {Order} from "../../../catalogue/model/publish/order";
import {OrderResponseSimple} from "../../../catalogue/model/publish/order-response-simple";
/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: 'order-response',
    templateUrl: './order-response.component.html'
})

export class OrderResponseComponent {
    @Input() order:Order;
    @Input() orderResponse:OrderResponseSimple;
}
