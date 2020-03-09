import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import {ChildFormBase} from './validation/child-form-base';
import {FormControl,  Validators} from '@angular/forms';
import {ValidationService} from './validation/validators';
const FIELD_NAME_NUMBER = 'number';
@Component({
    selector: "plain-amount-input",
    templateUrl: "./plain-amount-input.component.html",
    styleUrls: ["./plain-amount-input.component.css"],
})
export class PlainAmountInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() required = false;

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() valueTextClass: string = "";

    private amountValue: number;
    amountFormControl: FormControl;
    @Output() amountChange = new EventEmitter<number>();
    @Input() amountUnit?: string;

    @Input()
    get amount(): number {
        return this.amountValue;
    }

    set amount(value: number) {
        this.amountValue = value;
        this.amountChange.emit(value);
    }

    constructor(public validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
    }

    initializeForm(): void {
        this.amountFormControl = new FormControl(this.amount, this.required ? [Validators.required] : []);
        this.addToCurrentForm(FIELD_NAME_NUMBER, this.amountFormControl);
    }
}
