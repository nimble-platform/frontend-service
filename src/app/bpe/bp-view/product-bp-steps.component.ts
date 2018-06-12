import { Component, OnInit, Input } from "@angular/core";

type Step = "INFORMATION" | "PPAP" | "NEGOTIATION" | "ORDER" | "DONE";

@Component({
    selector: "product-bp-steps",
    templateUrl: "./product-bp-steps.component.html",
    styleUrls: ["./product-bp-steps.component.css"]
})
export class ProductBpStepsComponent implements OnInit {

    @Input() currentStep: Step;
    @Input() status: "OPEN" | "WAITING" | "TODO" | "DONE" = "OPEN";
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

    getStepClasses(step: Step): any {
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
            case "INFORMATION":
                return "0%";
            case "PPAP":
                return "20%";
            case "NEGOTIATION":
                return "40%";
            case "ORDER":
                return "60%";
            case "DONE":
                return "80%";
        }
    }

    private getStatusTextColor(): string {
        switch(this.status) {
            case "OPEN":
                return "#000000";
            case "WAITING":
                return "#c48601";
            case "TODO":
                return "#d30000";
            case "DONE":
                return "#007706";
        }
    }
}
