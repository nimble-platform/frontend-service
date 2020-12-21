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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ProductPublishStep} from './product-publish-step';
import * as myGlobals from '../../globals';

@Component({
    selector: 'product-publish-steps',
    templateUrl: './product-publish-steps.component.html',
    styleUrls: ['./product-publish-steps.component.css']
})
export class ProductPublishStepsComponent {

    _currentStep: ProductPublishStep;
    @Input()
    set currentStep(currectStep: ProductPublishStep) {
        this._currentStep = currectStep;
        // set the visited step with max order
        if(ProductPublishStepsComponent.getStepOrder(currectStep) > ProductPublishStepsComponent.getStepOrder(this.visitedStepWithMaxOrder)){
            this.visitedStepWithMaxOrder = currectStep;
        }
    }

    get currentStep(): ProductPublishStep {
        return this._currentStep;
    }
    @Input() catalogueStepEnabled:boolean = false;
    // single upload or bulk upload
    @Input() publishingGranularity:string = null;
    @Output() onStepChanged = new EventEmitter<ProductPublishStep>();
    // the visited step with the max order
    visitedStepWithMaxOrder:ProductPublishStep = "Category";

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

        return {
            step: true,
            visited: ProductPublishStepsComponent.getStepOrder(step) <= ProductPublishStepsComponent.getStepOrder(this.visitedStepWithMaxOrder)
        };
    }

    public onStepClicked(step: ProductPublishStep){
        this.onStepChanged.next(step);
    }

    /**
     * Returns the order for the given step
     * */
    private static getStepOrder(step: ProductPublishStep){
        switch (step) {
            case 'Category':
                return 0;
            case 'Catalogue':
                return 1;
            case 'ID/Name/Image':
                return 2;
            case 'Details':
                return 3;
            case 'Price':
                return 4;
            case 'Delivery&Trading':
                return 5;
            case 'Certificates':
                return 6;
            case 'LCPA':
                return 7;
            default:
                return 8;
        }
    }
}
