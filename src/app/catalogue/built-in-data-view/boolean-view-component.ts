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
    @Input() value:any; // can be string or boolean
    @Output() valueChanged = new EventEmitter();
    typeof = typeof this.value;

    onCheckChanged(event):void {
        this.valueChanged.emit(event.target.checked);
    }
}
