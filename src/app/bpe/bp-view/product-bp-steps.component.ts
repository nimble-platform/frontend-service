import { Component, OnInit, Input } from "@angular/core";
import { ProductBpStepStatus } from "./product-bp-step-status";
import { ProductBpStep } from "./product-bp-step";
import { ProductBpStepsDisplay } from "./product-bp-steps-display";
import * as myGlobals from '../../globals';

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

    config = myGlobals.config;
    steps = ["0%","17%","33%","50%","67%","83%"];

    constructor() {

    }

    ngOnInit() {
      if (!this.config.showPPAP)
        this.steps = ["0%","0%","20%","40%","60%","80%"];
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
        else if (this.displayMode === "Logistics"){
            return "42%";
        }
        else if (this.displayMode === "Transport_After_Order") {
          switch(this.currentStep) {
              case "Item_Information_Request":
                  return "0%";
              case "Transport_Information_Request":
                  return "17%";
              case "Transport_Negotiation":
                  return "33%";
              case "Transport_Order":
                  return "50%";
              case "Transport_Order_Confirmed":
                  return "67%";
              case "Fulfilment":
                  return "83%";
              default:
                  throw new Error("Unexpected step for displayMode 'Transport_After_Order': " + this.currentStep);
          }
        }
        else {
          switch(this.currentStep) {
              case "Item_Information_Request":
                  return this.steps[0];
              case "Ppap":
                  return this.steps[1];
              case "Negotiation":
                  return this.steps[2];
              case "Order":
                  return this.steps[3];
              case "Order_Confirmed":
                  return this.steps[4];
              case "Fulfilment":
                  return this.steps[5];
              default:
                  throw new Error("Unexpected step for displayMode 'Order': " + this.currentStep);
          }
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
