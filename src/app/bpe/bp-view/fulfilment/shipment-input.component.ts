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
    date:any;
    showDate: boolean = true;

    constructor() {

    }

    ngOnInit(){
        if(this.shipment.shipmentStage[0].estimatedDeliveryDate){
            const dateParts = this.shipment.shipmentStage[0].estimatedDeliveryDate.trim().split('-');
            let index = dateParts[2].indexOf('T');
            this.date = {year: Number(dateParts[0]),month:Number(dateParts[1]),day:Number(dateParts[2].substring(0,index))};
        }
    }

    getEstimatedDeliveryDate():string{
        return this.date.year+"-"+this.date.month+"-"+this.date.day;
    }
}