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
