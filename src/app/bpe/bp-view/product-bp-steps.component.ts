import { Component, OnInit, Input } from "@angular/core";
import { ProductBpStepStatus } from "./product-bp-step-status";
import { ProductBpStep } from "./product-bp-step";
import { ProductBpStepsDisplay } from "./product-bp-steps-display";

@Component({
    selector: "product-bp-steps",
    templateUrl: "./product-bp-steps.component.html",
    styleUrls: ["./product-bp-steps.component.css"]
})
export class ProductBpStepsComponent implements OnInit {

    @Input() currentStep: ProductBpStep;
    @Input() status: ProductBpStepStatus;
    @Input() displayMode: ProductBpStepsDisplay;
    @Input() statusText: string = "";
    
    constructor() {
        
    }

    ngOnInit() {
        console.log("Current Step: " + this.currentStep)
        console.log("Status: " + this.status)
        console.log("Status Text: " + this.statusText)
        console.log("Display Mode: " + this.displayMode)
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
        if(this.displayMode === "Transport") {
            switch(this.currentStep) {
                case "Transport_Information_Request":
                case "Item_Information_Request":
                    return "0%";
                case "Transport_Negotiation":
                    return "25%";
                case "Transport_Order":
                    return "50%";
                case "Transport_Order_Confirmed":
                    return "75%";
                default:
                    throw new Error("Unexpected step for displayMode 'Transport': " + this.currentStep);
            }
        }
        switch(this.currentStep) {
            case "Item_Information_Request":
                return "0%";
            case "Ppap":
            case "Transport_Information_Request":
                return "17%";
            case "Negotiation":
            case "Transport_Negotiation":
                return "33%";
            case "Order":
            case "Transport_Order":
                return "50%";
            case "Order_Confirmed":
            case "Transport_Order_Confirmed":
                return "67%";
            case "Fulfilment":
                return "83%";
            default:
                throw new Error("Unexpected step for displayMode 'Transport': " + this.currentStep);
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
