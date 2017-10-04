import {Component, Input, Output, EventEmitter} from "@angular/core";
/**
 * Created by suat on 22-Sep-17.
 */
@Component({
    selector: 'value-array-view',
    templateUrl: './value-array-view.component.html'
})

export class ValueArrayViewComponent {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() values: any[];

    addNewValue():void {
        let value:any;
        this.values.push(value);
    }

    removeValue(index:number):void {
        this.values.splice(index, 1);
    }

    trackByIndex(index: any, item: any) {
        return index;
    }
}
