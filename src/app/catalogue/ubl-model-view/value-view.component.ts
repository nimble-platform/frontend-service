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
    @Input() presentationMode: "singlevalue" | "edit";
    @Input() propName: string;
    @Input() mandatory: boolean = false;
    @Input() largeInput: boolean = false;
    // the definition of the property
    @Input() definition: string = null;
    control:FormControl;

    json=JSON

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

    constructor() {
        super();
    }

    ngOnInit() {
        this.control = new FormControl(null, this.mandatory ? Validators.required : null);
        this.addToParentForm(this.propName, this.control);
    }

    ngOnDestroy() {
        this.removeFromParentForm(this.propName);
    }
}
