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

import { Component, EventEmitter, OnInit, Input, Output, ViewChild, ElementRef } from "@angular/core";
import {TranslateService} from '@ngx-translate/core';

export interface Option {
    name: string
    value: string
}

@Component({
    selector: "options-input",
    templateUrl: "./options-input.component.html",
    styleUrls: ["./options-input.component.css"],
})
export class OptionsInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() sizeClass: string; // set based on label
    @Input() selectClass = ''; // class to set for select element

    @Input() options: Array<string | Option>;
    /*
    * Whether the given options are multilingual or not.
    * */
    @Input() areOptionsMultilingual:boolean = false;
    @Input() selectedIndex: number = -1; // this is added just to initialize the selected properly in case there are multiple options with the same value
    private selectedValue: string;
    @Output() selectedChange = new EventEmitter<string>();
    @Output() selectedOptionChange = new EventEmitter<string | Option>(); // selected option is kept since at some places the option itself is required. e.g. we want to make a distinction
    // between image and file property qualifiers

    @Input() large: string = "false";
    innerFormClass = "form-control-sm";
    @ViewChild('optionsInputSelect') optionsInputSelect;

    constructor(public translateService:TranslateService) {

    }

    ngOnInit() {
        if (!this.sizeClass) {
            this.sizeClass = this.label ? "col-9" : "col-12";
        }
        if (this.large == "true")
            this.innerFormClass = "";
        else
            this.innerFormClass = "form-control-sm";
    }

    ngAfterViewInit() {
        if (this.selectedIndex != -1) {
            setTimeout((() => {
                this.optionsInputSelect.nativeElement.selectedIndex = this.selectedIndex;
            }), 0);
        }
    }

    @Input()
    get selected(): string {
        return this.selectedValue;
    }

    set selected(selected: string) {
        this.selectedValue = selected;
        this.selectedChange.emit(selected);
    }

    onChange(event): void {
        this.selectedIndex = event.target.selectedIndex;
        let selectedOption = this.options[this.selectedIndex];

        // emit also the selected option itself
        this.selectedOptionChange.emit(selectedOption);
    }

    getValue(option: Option | string): string {
        if (option) {
            return typeof option === "string" ? option : option.value;
        }
        if (option == "") {
            return ""
        }
    }

    getName(option: Option | string): string {
        if (option) {
            let optionName = typeof option === "string" ? option : option.name;
            if(this.areOptionsMultilingual){
                optionName = this.translateService.instant(optionName);
            }
            return optionName;
        }
    }
}
