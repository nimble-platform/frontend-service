import {Component, Input, OnInit} from "@angular/core";
import {Quantity} from "../model/publish/quantity";
import {Subject} from "rxjs/Subject";
import {Amount} from "../model/publish/amount";
import {ChildForm} from "../child-form";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {UnitService} from '../../common/unit-service';

@Component({
    selector: 'amount-view',
    templateUrl: './amount-view.component.html'
})

export class AmountViewComponent extends ChildForm implements OnInit {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() mandatory:boolean = false;
    @Input() amount: Amount[];
    @Input() definition: string;

    // units for currency
    currencyValues = [];
    // the validator below is used to enforce both values are populated in case
    // the amount element is optional and only one of the fields are filled in
    bothValuesExist = (control: AbstractControl): {[key: string]: boolean} => {
        const amount = control.get('amount');
        const currency = control.get('currency');

        // if only one of the fields is filled in
        if (((!amount || !amount.value) && (currency && currency.value))
            || ((!currency || !currency.value) && (amount && amount.value))) {
            return {bothValues : false};
        } else {
            return null;
        }
    };

    amountForm:FormGroup = this.fb.group({}, { validator: this.bothValuesExist });

    constructor(private fb:FormBuilder,
                private unitService:UnitService) {
        super();
    }

    ngOnInit() {

        this.unitService.getCachedUnitList("currency_quantity").then(res => {
            this.currencyValues = [""].concat(res);
        });

        let amountControl:FormControl = new FormControl(null, this.mandatory ? Validators.required : null);
        let currencyControl:FormControl = new FormControl(null, this.mandatory ? Validators.required : null);
        this.amountForm.addControl('amount', amountControl);
        this.amountForm.addControl('currency', currencyControl);

        this.addToParentForm(this.propName, this.amountForm);
    }

    ngOnDestroy() {
        this.removeFromParentForm(this.propName);
    }
}
