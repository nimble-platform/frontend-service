import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ChildForm} from "../child-form";
/**
 * Created by suat on 19-Sep-17.
 */
@Component({
    selector: 'value-view',
    templateUrl: './value-view.component.html'
})

export class ValueViewComponent extends ChildForm implements OnInit {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() mandatory:boolean = false;

    control:FormControl;

    valueObj;
    @Output() valueChange = new EventEmitter();

    @Input()
    get value() {
        return this.valueObj;
    }

    set value(val) {
        this.valueObj = val;
        this.valueChange.emit(this.valueObj);
    }
    json=JSON
    constructor() {
        super();
    }

    ngOnInit() {
        this.control = new FormControl(null, this.mandatory ? Validators.required : null);
        this.addToParentForm(this.propName, this.control);
    }
}
