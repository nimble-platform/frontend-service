/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit, Input } from "@angular/core";
import { ProductBpStepStatus } from "./product-bp-step-status";
import { ProductBpStep } from "./product-bp-step";
import { ProductBpStepsDisplay } from "./product-bp-steps-display";
import * as myGlobals from '../../globals';
import { BPDataService } from './bp-data-service';
import {TranslateService} from '@ngx-translate/core';

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

    // map representing the processes which are included in the seller's workflow
    // id is the process id and value is true or false (whether the process is included or not)
    companyWorkflowMap = null;

    config = myGlobals.config;

    constructor(public bpDataService:BPDataService,private translate: TranslateService) {
    }

    ngOnInit() {
        // set companyWorkflowMap
        this.companyWorkflowMap = this.bpDataService.getCompanyWorkflowMap(null);
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
