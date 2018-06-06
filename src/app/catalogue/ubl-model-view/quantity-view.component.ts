import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Quantity} from "../model/publish/quantity";
import {UBLModelUtils} from "../model/ubl-model-utils";
import {ChildForm} from "../child-form";
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {UnitService} from '../../common/unit-service';

@Component({
    selector: 'quantity-view',
    templateUrl: './quantity-view.component.html'
})

export class QuantityViewComponent extends ChildForm implements OnInit {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() mandatory:boolean = false;
    @Input() readonly: boolean = true;
    @Input() quantity: Quantity[];
    // whether the quantity value can multiple values
    @Input() multiValue: boolean;
    // whether the quantity value can have no value at all
    @Input() zeroValue: boolean = false;
    @Input() editablePropName:boolean;
    // the definition of this quantity
    @Input() definition: string = null;
    // type of this quantity such as time or volume
    @Input() type = null;

    // single mode events
    @Output() onSelectChange = new EventEmitter();
    // edit mode events
    @Output() onValueAdded = new EventEmitter();
    @Output() onValueDeleted = new EventEmitter();
    @Output() onPropNameEdit = new EventEmitter();

    // the validator below is used to enforce both values are populated in case
    // the amount element is optional and only one of the fields are filled in
    bothValuesExist = (control: AbstractControl): {[key: string]: boolean} => {
        const quantity = control.get('quantity');
        const unit = control.get('unit');

        // if only one of the fields is filled in
        if (((!quantity || !quantity.value) && (unit && unit.value))
            || ((!unit || !unit.value) && (quantity && quantity.value))) {
            return {bothValues : false};
        } else {
            return null;
        }
    };

    quantityForm:FormGroup = this.fb.group({});
    quantityFormArray:FormArray = this.fb.array([]);
    parentFormKey: string = UBLModelUtils.generateUUID();
    json = JSON;

    unitValues = [];
    constructor(private fb:FormBuilder,
                private unitService:UnitService) {
        super();
        this.quantityForm.addControl('values', this.quantityFormArray)
    }

    ngOnInit() {
        if(this.type){
            this.unitService.getCachedUnitList(this.type).then(res => {
                this.unitValues = [""].concat(res);
            });
        }
        this.createFormControlsForQuantities();
        this.addToParentForm(this.parentFormKey, this.quantityForm);
    }

    ngOnDestroy() {
        this.removeFromParentForm(this.parentFormKey);
    }

    addNewValue():void {
        this.quantity.push(UBLModelUtils.createQuantity());
        let newGroup:FormGroup = this.createFormControlForQuantity();
        this.quantityFormArray.push(newGroup);
        this.onValueAdded.emit();
    }

    removeValue(index:number):void {
        let value:number = this.quantity[index].value;
        this.quantity.splice(index, 1);

        // move the editible prop name control to first control in quantity form array
        if(this.quantityFormArray.controls.length > 1 && this.editablePropName) {
            (this.quantityFormArray.controls[1] as FormGroup).addControl('propName', (this.quantityFormArray.controls[0] as FormGroup).controls['propName']);
        }
        this.quantityFormArray.removeAt(index);
        this.onValueDeleted.emit(value);
    }

    selectChanged(event:any):void {
        this.onSelectChange.emit(event);
    }

    onPropNameEditFocusOut(event:any):void {
        this.onPropNameEdit.emit(event.target.value);
    }

    createFormControlsForQuantities():void {
        for(let i=0; i<this.quantity.length; i++) {
            let valueFormGroup:FormGroup = this.createFormControlForQuantity();

            if(i==0 && this.editablePropName) {
                let propNameControl:FormControl = new FormControl(null, Validators.required);
                valueFormGroup.addControl('propName', propNameControl);
            }

            this.quantityFormArray.push(valueFormGroup);
        }
    }

    createFormControlForQuantity(): FormGroup {
        let quantityControl:FormControl = new FormControl(null, this.mandatory ? Validators.required : null);
        let unitControl:FormControl = new FormControl(null, this.mandatory ? Validators.required : null);

        let valueFormGroup:FormGroup = new FormGroup({}, this.bothValuesExist);
        valueFormGroup.addControl('quantity', quantityControl);
        valueFormGroup.addControl('unit', unitControl);

        return valueFormGroup;
    }

}
