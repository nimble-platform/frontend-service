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

import { Component, ElementRef, EventEmitter, Output, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MultiTypeValue } from "../catalogue/model/publish/multi-type-value";
import { Quantity } from "../catalogue/model/publish/quantity";
import { Text } from "../catalogue/model/publish/text";
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: "lcpa-detail-modal",
    templateUrl: "./lcpa-detail-modal.component.html"
})
export class LcpaDetailModalComponent {

    @ViewChild("modal") modal: ElementRef;
    @Output() valueAdded = new EventEmitter<MultiTypeValue>();

    lcpaInputDetail: MultiTypeValue = new MultiTypeValue();
    presentationMode: "edit" | "view" = "edit";
    valueQualifiers = [
        { name: "Text", value: "STRING" },
        { name: "Quantity", value: "QUANTITY" },
    ];

    constructor(private translate: TranslateService,
        private modalService: NgbModal) {
    }

    open() {
        this.lcpaInputDetail = new MultiTypeValue();
        this.lcpaInputDetail.valueQuantity.push(new Quantity());
        this.lcpaInputDetail.valueDecimal.push(undefined);
        this.lcpaInputDetail.value.push(new Text());
        this.modalService.open(this.modal);
    }

    addDetail(c: any): void {
        this.valueAdded.emit(this.lcpaInputDetail);
        c();
    }
}
