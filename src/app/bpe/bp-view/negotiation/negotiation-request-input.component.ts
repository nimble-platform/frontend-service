import { Component, EventEmitter, OnInit, Input, Output, OnChanges } from "@angular/core";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { UnitService } from "../../../common/unit-service";
import {ChildFormBase} from '../../../common/validation/child-form-base';
import {FormControl, Validators} from '@angular/forms';
import {ValidatorFn} from '@angular/forms/src/directives/validators';
import {periodValidator, stepValidator, ValidationService} from '../../../common/validation/validators';
import {FIELD_NAME_QUANTITY_VALUE} from '../../../common/constants';
import {PeriodRange} from '../../../user-mgmt/model/period-range';
const FIELD_NAME_NEGOTIATION_REQUEST_QUANTITY_INPUT_VALUE = 'quantity_value';
const FIELD_NAME_NEGOTIATION_REQUEST_QUANTITY_INPUT_UNIT = 'quantity_unit';
@Component({
    selector: "negotiation-request-input",
    templateUrl: "./negotiation-request-input.component.html",
    styleUrls: ["./negotiation-request-input.component.css"],
})
export class NegotiationRequestInputComponent extends ChildFormBase implements OnInit {

    @Input() label: string;
    @Input() description: string;

    // see https://blog.angulartraining.com/tutorial-create-your-own-two-way-data-binding-in-angular-46487650ea82 for this trick
    // private cbModelValue: boolean;
    // @Output() cbModelChange = new EventEmitter<boolean>();
    // @Input() cbDisabled: boolean = false;
    @Input() disabled: boolean = false;
    @Input() invalid: boolean = false;
    @Input() id: string;
    
    // Set if the input should be of type text.
    private textValue?: string;
    @Output() textChange = new EventEmitter<string>();

    // Set if the input should be a drop down list.
    @Input() options?: string[];
    private selectedValue: string;
    @Output() selectedChange = new EventEmitter<string>();

    // Set if the input is a quantity
    @Input() quantity: Quantity;
    @Output() quantityChange = new EventEmitter<Quantity>();
    @Input() quantityUnits?: string[];
    @Input() quantityType?: string;
    @Input() disableQuantityUnit?: boolean = false;
    @Input() step: number = 1;
    @Input() periodRanges: PeriodRange[];
    quantityValueFormControl: FormControl = new FormControl();
    quantityUnitFormControl: FormControl = new FormControl();

    // Set if the input is a number
    @Input() amountValue?: number;
    @Output() amountChange = new EventEmitter<number>();
    @Input() amountUnit?: string;

    constructor(private unitService: UnitService,
                private validationService: ValidationService) {
        super();
    }

    // @Input()
    // get cbModel(): boolean {
    //     return this.cbModelValue;
    // }
    //
    // set cbModel(cbModel: boolean) {
    //     this.cbModelValue = cbModel;
    //     this.cbModelChange.emit(cbModel);
    // }

    @Input()
    get text(): string {
        return this.textValue;
    }

    set text(text: string) {
        this.textValue = text;
        this.textChange.emit(text);
    }

    @Input()
    get selected(): string {
        return this.selectedValue;
    }

    set selected(selected: string) {
        this.selectedValue = selected;
        this.selectedChange.emit(selected);
    }

    onQuantityValueChanged(): void {
        this.quantityChange.emit(this.quantity);
    }

    @Input()
    get amount(): number {
        return this.amountValue;
    }

    set amount(value: number) {
        this.amountValue = value;
        this.amountChange.emit(value);
    }

    get formControlClass(): string {
        return this.invalid ? "ng-invalid" : "ng-valid";
    }

    ngOnInit() {
        if (this.quantity) {
            if (this.quantityType) {
                this.unitService.getCachedUnitList(this.quantityType)
                    .then(units => {
                        this.quantityUnits = units;
                        this.initViewFormAndAddToParentForm();
                    })
            } else {
                this.initViewFormAndAddToParentForm();
            }
        }
    }

    initializeForm(): void {
        if (this.quantityUnits && this.quantityUnits.length > 0) {
            this.quantityUnitFormControl = new FormControl(this.quantityUnits[0]);
            this.addToCurrentForm(FIELD_NAME_NEGOTIATION_REQUEST_QUANTITY_INPUT_UNIT, this.quantityUnitFormControl);

            let quantityValueValidators: ValidatorFn[] = [];
            if (this.periodRanges) {
                quantityValueValidators.push(periodValidator(this.quantityUnitFormControl, this.quantityUnits, this.periodRanges));
            }
            this.quantityValueFormControl = new FormControl(this.quantity.value, quantityValueValidators);
            this.addToCurrentForm(FIELD_NAME_NEGOTIATION_REQUEST_QUANTITY_INPUT_VALUE, this.quantityValueFormControl);
        }
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
    }
}
