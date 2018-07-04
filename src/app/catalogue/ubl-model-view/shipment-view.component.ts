import {Component, Input} from "@angular/core";
import {Shipment} from "../model/publish/shipment";

@Component({
    selector: 'shipment-view',
    templateUrl: './shipment-view.component.html'
})

export class ShipmentViewComponent {
    @Input() shipment: Shipment;
    @Input() presentationMode: string;
    @Input() showCarrierPartyDetails: boolean = true;
    // used to get correct format for the estimatedDeliveryDate of shipment
    @Input() date:any;
    @Input() showDate: boolean = true;

    getEstimatedDeliveryDate():string{
        return this.date.year+"-"+this.date.month+"-"+this.date.day;
    }
}
