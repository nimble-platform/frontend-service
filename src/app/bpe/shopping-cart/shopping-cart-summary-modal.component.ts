/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
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

import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from '@ngx-translate/core';
import * as myGlobals from '../../globals';
import { quantityToString } from '../../common/utils';
import { NegotiationModelWrapper } from '../bp-view/negotiation/negotiation-model-wrapper';

@Component({
    selector: "shopping-cart-summary-modal",
    templateUrl: "./shopping-cart-summary-modal.component.html",
    styleUrls: ['./shopping-cart-summary-modal.component.css']
})
export class ShoppingCartSummaryModalComponent {

    @ViewChild("modal") modal: ElementRef;
    // Inputs
    @Input() negotiationModelWrappers: NegotiationModelWrapper[];

    // Outputs
    @Output() onMultipleLineNegotiation = new EventEmitter();

    config = myGlobals.config;

    quantityToString = quantityToString;

    constructor(private translate: TranslateService,
        private modalService: NgbModal) {
    }

    open() {
        this.modalService.open(this.modal, { windowClass: 'large-modal' });
    }

    onNegotiation(c: any) {
        this.onMultipleLineNegotiation.emit();
        c();
    }

}
