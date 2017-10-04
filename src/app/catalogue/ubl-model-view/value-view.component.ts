import {Component, EventEmitter, Input, Output} from "@angular/core";
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
}
