import {ChangeDetectorRef, Component, Input, OnInit} from "@angular/core";
import {Order} from "../../../catalogue/model/publish/order";
import { CallStatus } from "../../../common/call-status";

/**
 * Created by suat on 20-Sep-17.
 */
@Component({
    selector: "order",
    templateUrl: "./order.component.html",
    styleUrls: ["./order.component.css"]
})
export class OrderComponent implements OnInit {
    
    @Input() order: Order;

    callStatus: CallStatus = new CallStatus();

    constructor() {

    }

    ngOnInit(): void {

    }

    isLoading(): boolean {
        return false;
    }

    onBack() {

    }

    onOrder() {
        
    }
}
