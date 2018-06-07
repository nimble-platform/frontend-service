import {Component, Input, OnInit} from "@angular/core";
import {Quantity} from "../model/publish/quantity";
import {Subject} from "rxjs/Subject";
import {Amount} from "../model/publish/amount";
import {ChildForm} from "../child-form";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
    selector: 'quantity-value-view',
    templateUrl: './quantity-value-view.component.html'
})

export class QuantityValueViewComponent {
    @Input() propName: string;
    @Input() value: number;
    @Input() unitType: string;
    @Input() unit: string;
    @Input() definition: string;
}
