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

    constructor() {

    }

    ngOnInit() {
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

}
