import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Quantity} from "../catalogue/model/publish/quantity";
import {UnitService} from "./unit-service";
import {isCustomProperty, quantityToString} from "./utils";
import {AbstractControl, FormControl, Validators} from '@angular/forms';
import {ChildFormBase} from './validation/child-form-base';
import {ValidatorFn} from '@angular/forms/src/directives/validators';
import {stepValidator, ValidationService} from './validation/validators';
import {ItemProperty} from '../catalogue/model/publish/item-property';
import {PublishingPropertyService} from '../catalogue/publish/publishing-property.service';

const NUMBER_VALUE_FORM_CONTROL = 'numberValue';

@Component({
    selector: "quantity-input",
    templateUrl: "./quantity-input.component.html",
    styleUrls: ["./quantity-input.component.css"],
})
export class QuantityInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() valueSizeClass: string = "col-7";
    @Input() unitSizeClass: string = "col-5";
    @Input() placeholder: string = "...";
    @Input() unitPlaceholder: string = "Unit";
    @Input() valueTextClass: string = "";

    @Input() quantity: Quantity;
    @Output() onQuantityValueChange = new EventEmitter<number>();
    @Output() onQuantityUnitChange = new EventEmitter<string>();
    @Input() quantityUnits?: string[];
    @Input() quantityType?: string;
    @Input() disableQuantityUnit: boolean = false;
    @Input() large: string = "false";
    innerFormClass = 'form-control-sm';

    // form validation inputs
    @Input() required = false;
    @Input() minimum: number;

    @Input() property:ItemProperty = null;

    // step logic
    _step = 1;
    @Input() set step(step: number) {
        step = step || 1;
        this._step = step;

        // when step is changed the form control of the number input should also change
        // however, if the quantity is not set yet, skip it as the form control depends on the quantity
        if (this.quantity) {
            this.initNumberInputFormControl();
        }
    }
    get step(): number {
        return this._step;
    }
    // end of step logic
    // end of form validation inputs

    quantityValueFormControl: FormControl;

    constructor(private unitService: UnitService,
                private publishingPropertyService: PublishingPropertyService,
                private validationService: ValidationService) {
        super();
    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }

        if (this.large == "true")
          this.innerFormClass = "";
        else
          this.innerFormClass = "form-control-sm";

        if(this.property && !isCustomProperty(this.property)){
            this.publishingPropertyService.getCachedProperty(this.property.id).then(indexedProperty => {
                if(indexedProperty.codeList && indexedProperty.codeList.length > 0){
                    this.quantityUnits = indexedProperty.codeList;
                }
            });
        } else if(this.quantityType) {
            this.quantityUnits = ["Loading..."];
            this.unitService.getCachedUnitList(this.quantityType)
            .then(units => {
                this.quantityUnits = units;
                this.initQuantityUnit();
            })
        } else if(this.quantityUnits != null && this.quantityUnits.length > 0) {
            this.initQuantityUnit();
        }

        // initialize form controls
        this.initViewFormAndAddToParentForm();
    }

    private initQuantityUnit(): void {
        if(this.quantity.unitCode == null && this.quantityUnits != null){
            this.quantity.unitCode = this.quantityUnits[0];
        }
    }

    /**
     * template-related methods handlers
     */
    onQuantityValueChanged(value: number) {
        this.onQuantityValueChange.emit(value);
    }

    onQuantityUnitChanged(unit: string) {
        this.onQuantityUnitChange.emit(unit);
    }

    quantityToString(): string {
        return quantityToString(this.quantity);
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
        let validators: ValidatorFn[] = [stepValidator(this.step)];
        if (this.minimum) {
            validators.push(Validators.min(this.minimum));
        }
        if (this.required) {
            if (!this.minimum) {
                validators.push(Validators.min(1));
            }
        }
        // required validator is already on the template

        this.quantityValueFormControl = new FormControl(this.quantity.value, validators);
        if (this.formGroup.contains(NUMBER_VALUE_FORM_CONTROL)) {
            this.formGroup.removeControl(NUMBER_VALUE_FORM_CONTROL);
        }
        this.formGroup.addControl(NUMBER_VALUE_FORM_CONTROL, this.quantityValueFormControl);
    }
}
