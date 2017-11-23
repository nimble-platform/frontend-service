import {Component, Input} from "@angular/core";
import {Address} from "../model/publish/address";
import {UBLModelUtils} from "../model/ubl-model-utils";
import {Shipment} from "../model/publish/shipment";

@Component({
    selector: 'shipment-view',
    templateUrl: './shipment-view.component.html'
})

export class ShipmentViewComponent {
    @Input() shipment: Shipment;
    @Input() presentationMode: string;
}
