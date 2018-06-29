import { Component, Input } from "@angular/core";
import { Shipment } from "../../../catalogue/model/publish/shipment";

@Component({
    selector: "shipment-input",
    templateUrl: "./shipment-input.component.html"
})
export class ShipmentInputComponent {
    
    @Input() shipment: Shipment;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() disabled: boolean = false;

    constructor() {

    }

}