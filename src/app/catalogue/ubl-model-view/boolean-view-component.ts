import {Component, EventEmitter, Input, Output} from "@angular/core";
/**
 * Created by suat on 22-Sep-17.
 */

@Component({
    selector: 'boolean-view',
    templateUrl: './boolean-view.component.html'
})

export class BooleanViewComponent {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Output() valueChanged = new EventEmitter();
    // the definition of the property
    @Input() definition: string = null;

    valueObj:boolean;
    @Input()
    get value() {
        return this.valueObj;
    }

    set value(val) {
        this.valueObj = val;
        this.valueChanged.emit(val);
    }
}
