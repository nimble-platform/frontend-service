/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
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

import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
    selector: "facet",
    templateUrl: "./facet-component.html",
    styleUrls: ["./facet-component.css"]
})
export class FacetComponent {
    @Input() title: string;
    @Input() dataType: "string" | "boolean" = "string";
    @Input() booleanValue: boolean = false;
    @Input() stringValues: string[] = [];
    @Input() stringValuesToBeDisplayed: string[] = null;
    @Input() selectedStringValues: string[] = [];
    @Input() filterActive: boolean = false; // true means user already selected a value for this facet, in this case we check the checkboxes
    @Input() loading: boolean = false
    @Input() disableMultipleSelection: boolean = false;

    @Output() booleanValueChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() triggerCriteriaChanged: EventEmitter<void> = new EventEmitter<void>();

    expanded: boolean = false;
    maxFacets = 5;

    constructor(
    ) {
    }


    selectStringValue(value: string): void {
        if (this.disableMultipleSelection) {
            this.selectedStringValues.splice(0, 1);
            this.selectedStringValues.push(value);
            return;
        }
        let index = this.selectedStringValues.indexOf(value);
        if (index == -1) {
            this.selectedStringValues.push(value);
        } else {
            this.selectedStringValues.splice(index, 1);
        }
    }

    noResults(): boolean {
        if (this.loading) {
            return false;
        }
        return this.dataType === "string" && (!this.stringValues || this.stringValues.length === 0);
    }
}
