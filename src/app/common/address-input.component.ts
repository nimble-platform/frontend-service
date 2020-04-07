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

import {Component, OnInit, Input, forwardRef} from '@angular/core';
import { Address } from "../catalogue/model/publish/address";
import { PresentationMode } from "../catalogue/model/publish/presentation-mode";
import {EmptyFormBase} from './validation/empty-form-base';
const ADDRESS_INPUT_FIELD_NAME = 'address';
@Component({
    selector: "address-input",
    templateUrl: "./address-input.component.html",
    styleUrls: ["./address-input.component.css"]
})
export class AddressInputComponent extends EmptyFormBase implements OnInit {

    @Input() address: Address = new Address();
    @Input() presentationMode: PresentationMode = "edit";
    @Input() disabled: boolean = false;

    constructor() {
        super(ADDRESS_INPUT_FIELD_NAME);
    }

    ngOnInit() {
        this.initViewFormAndAddToParentForm();
    }
}
