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

import { Component, Input } from "@angular/core";
import { MultiTypeValue } from "../catalogue/model/publish/multi-type-value";
import { UBLModelUtils } from "../catalogue/model/ubl-model-utils";
import { quantityToString } from "./utils";

@Component({
    selector: "multi-type-input",
    templateUrl: "./multi-type-input.component.html"
})
export class MultiTypeInputComponent {

    @Input() multiTypeValue: MultiTypeValue;
    @Input() presentationMode: 'edit' | 'view' = 'edit';
    @Input() disabled: boolean = this.presentationMode == 'edit' ? false : true;

    constructor() {

    }

    getValueToPresent() {
        if (this.multiTypeValue) {
            let type: string = this.multiTypeValue.valueQualifier;
            let value = UBLModelUtils.getFirstFromMultiTypeValueByQualifier(this.multiTypeValue);
            if (value) {
                if (type == 'TEXT') {
                    return value.value;
                } else if (type == 'NUMBER') {
                    return value;
                } else if (type == 'QUANTITY') {
                    return quantityToString(value);
                }
            }
        }
        return '';
    }
}
