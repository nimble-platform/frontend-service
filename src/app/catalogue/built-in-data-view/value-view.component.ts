import {Component, Input, Output, EventEmitter} from "@angular/core";
/**
 * Created by suat on 19-Sep-17.
 */
@Component({
    selector: 'value-view',
    templateUrl: './value-view.component.html'
})

export class ValueViewComponent {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() multiValue:boolean;
    @Input() values: any[];

    // two-way binding for "value" field
    localValue: any;
    @Output() valueChange = new EventEmitter();
    @Input()
    get value() {
        return this.localValue;
    }
    set value(val) {
        this.localValue = val;
        this.valueChange.emit(this.localValue);
    }
}
