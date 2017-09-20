import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Quantity} from "../model/publish/quantity";
import {Subject} from "rxjs/Subject";

@Component({
    selector: 'quantity-view',
    templateUrl: './quantity-view.component.html'
})

export class QuantityViewComponent {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() quantity: Quantity[];
    @Output() onSelectChange = new EventEmitter();

    selectChanged(event:any):void {
        this.onSelectChange.emit(event);
    }
    // private selectedValue = new Subject();
    // selectedValueObs = this.selectedValue.asObservable();
    //
    // onSelectQuantityValue(selectedValue:any):void {
    //     this.selectedValue.next(selectedValue);
    // }
}
