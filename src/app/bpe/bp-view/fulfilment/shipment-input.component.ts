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

import { Component, Input, OnInit } from "@angular/core";
import { Shipment } from "../../../catalogue/model/publish/shipment";

@Component({
    selector: "shipment-input",
    templateUrl: "./shipment-input.component.html"
})
export class ShipmentInputComponent implements OnInit {

    @Input() shipment: Shipment;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() disabled: boolean = false;
    // used to get correct format for the estimatedDeliveryDate of shipment
    date: any = null;

    constructor() {

    }

    ngOnInit() {
        this.setEstimatedDeliveryDate();
    }

    setEstimatedDeliveryDate() {
        if (this.shipment.shipmentStage[0].estimatedDeliveryDate) {
            const dateParts = this.shipment.shipmentStage[0].estimatedDeliveryDate.trim().split('-');
            let index = dateParts[2].indexOf('T');
            if (index == -1) {
                this.date = dateParts[1] + "/" + dateParts[2] + "/" + dateParts[0];
            }
            else {
                this.date = dateParts[1] + "/" + dateParts[2].substring(0, index) + "/" + dateParts[0];
            }
        }
        else {
            this.date = null;
        }
    }
}
