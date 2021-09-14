/*
 * Copyright 2020
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

import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

@Component({
    selector: "boolean-input",
    templateUrl: "./boolean-input.component.html",
    styleUrls: ["./boolean-input.component.css"],
})
export class BooleanInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() valueTextClass: string = "";

    private booleanValue: boolean;
    @Output() valueChange = new EventEmitter<boolean>();

    constructor() {

    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    @Input()
    get value(): boolean {
        return this.booleanValue;
    }

    set value(value: boolean) {
        this.booleanValue = value;
        this.valueChange.emit(value);
    }
}
