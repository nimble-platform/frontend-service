import { Component, Input } from "@angular/core";
import {MultiTypeValue} from "../catalogue/model/publish/multi-type-value";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {quantityToString} from "./utils";

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
        if(this.multiTypeValue) {
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
