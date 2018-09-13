import {Component, Input, OnInit} from "@angular/core";
import { Shipment } from "../../../catalogue/model/publish/shipment";

@Component({
    selector: "shipment-input",
    templateUrl: "./shipment-input.component.html"
})
export class ShipmentInputComponent implements OnInit{
    
    @Input() shipment: Shipment;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() disabled: boolean = false;
    // used to get correct format for the estimatedDeliveryDate of shipment
    date:any = null;

    constructor() {

    }

    ngOnInit(){
        this.setEstimatedDeliveryDate();
    }

    setEstimatedDeliveryDate(){
        if(this.shipment.shipmentStage[0].estimatedDeliveryDate){
            const dateParts = this.shipment.shipmentStage[0].estimatedDeliveryDate.trim().split('-');
            let index = dateParts[2].indexOf('T');
            if(index == -1){
                this.date = dateParts[1] + "/" + dateParts[2] + "/" + dateParts[0];
            }
            else {
                this.date = dateParts[1] + "/" + dateParts[2].substring(0,index) + "/" + dateParts[0];
            }
        }
        else {
            this.date = null;
        }
    }
}