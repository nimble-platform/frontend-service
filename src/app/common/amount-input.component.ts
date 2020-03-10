import {Component, Input, OnInit} from "@angular/core";
import {UnitService} from "./unit-service";
import {amountToString} from "./utils";
import {Amount} from "../catalogue/model/publish/amount";
import {ChildFormBase} from './validation/child-form-base';
import {ValidatorFn} from '@angular/forms/src/directives/validators';
import {ValidationService} from './validation/validators';
import {AbstractControl, FormControl, Validators} from '@angular/forms';

const NUMBER_VALUE_FIELD_NAME = 'amount_value';

@Component({
    selector: "amount-input",
    templateUrl: "./amount-input.component.html",
    styleUrls: ["./amount-input.component.css"],
})
export class AmountInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() unitPlaceholder: string = "Unit";
    @Input() valueTextClass: string = "";

    @Input() amount: Amount;
    @Input() amountCurrencies?: string[];
    @Input() amountType?: string;
    @Input() disableAmountCurrency: boolean = false;

    @Input() required = false;

    amountValueFormControl: FormControl;

    constructor(private unitService: UnitService,
                private validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }

        if (this.amountType) {
            this.amountCurrencies = ["..."];
            this.unitService.getCachedUnitList(this.amountType)
                .then(units => {
                    this.amountCurrencies = units;
                    this.initAmountCurrency();
                });
        } else {
            if (this.amountCurrencies != null && this.amountCurrencies.length > 0) {
                this.initAmountCurrency();
            }
        }

        // initialize form controls
        this.initViewFormAndAddToParentForm();
    }

    private initAmountCurrency(): void {
        if(this.amount.currencyID == null && this.amountCurrencies != null){
            this.amount.currencyID = this.amountCurrencies[0];
        }
    }

    /**
     * template methods
     */
    amountToString(): string {
        return amountToString(this.amount);
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        return this.validationService.getValidationErrorMessage(formControl);
    }

    /**
     * private inner methods
     */
    initializeForm(): void {
        this.initNumberInputFormControl();
    }

    private initNumberInputFormControl(): void {
        let validators: ValidatorFn[] = [];
        if (this.required) {
            validators.push(Validators.min(1));
            validators.push(Validators.required);
        }

        this.amountValueFormControl = new FormControl(this.amount.value, validators);
        this.addToCurrentForm(NUMBER_VALUE_FIELD_NAME, this.amountValueFormControl);
    }
}
