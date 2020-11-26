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

import {Component, Input} from '@angular/core';
import {ProductPublishStep} from './product-publish-step';
import * as myGlobals from '../../globals';

@Component({
    selector: 'product-publish-steps',
    templateUrl: './product-publish-steps.component.html',
    styleUrls: ['./product-publish-steps.component.css']
})
export class ProductPublishStepsComponent {

    @Input() currentStep: ProductPublishStep;
    @Input() catalogueStepEnabled:boolean = false;
    // single upload or bulk upload
    @Input() publishingGranularity:string = null;

    config = myGlobals.config;

    constructor() {
    }

    getStepClasses(step: ProductPublishStep): any {
        if (step === this.currentStep) {
            return {
                step: true,
                current: true
            };
        }

        return {step: true}
    }

}
