import { Component, OnInit, Input } from "@angular/core";
import { ProductBpStepStatus } from "./product-bp-step-status";
import { ProductBpStep } from "./product-bp-step";

@Component({
    selector: "product-bp-steps",
    templateUrl: "./product-bp-steps.component.html",
    styleUrls: ["./product-bp-steps.component.css"]
})
export class ProductBpStepsComponent implements OnInit {

    @Input() currentStep: ProductBpStep;
    @Input() status: ProductBpStepStatus;
    @Input() statusText: string = "";
    
    constructor(

    ) { }

    ngOnInit() {

    }

    getStatusTextStyle(): any {
        return { 
            "margin-left": this.getStatusTextMarginLeft(), 
            "color": this.getStatusTextColor() 
        };
    }

    getStepClasses(step: ProductBpStep): any {
        if(step === this.currentStep) {
            const result: any = {
                step: true,
                current: true
            };
            
            result[this.status.toLowerCase()] = true;

            return result;
        }

        return { step: true }
    }

    private getStatusTextMarginLeft(): string {
        switch(this.currentStep) {
            case "Item_Information_Request":
                return "0%";
            case "Ppap":
                return "17%";
            case "Negotiation":
                return "33%";
            case "Order":
                return "50%";
            case "OrderConfirmed":
                return "67%";
            case "Fulfilment":
                return "83%";
        }
    }

    private getStatusTextColor(): string {
        switch(this.status) {
            case "OPEN":
                return "#000000";
            case "WAITING":
                return "#c48601";
            case "ACTION_REQUIRED":
                return "#d30000";
            case "DONE":
                return "#007706";
            case "CANCELLED":
                return "#363636";
        }
    }
}
