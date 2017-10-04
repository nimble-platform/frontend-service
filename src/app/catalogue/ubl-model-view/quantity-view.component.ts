import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Quantity} from "../model/publish/quantity";
import {UBLModelUtils} from "../model/ubl-model-utils";

@Component({
    selector: 'quantity-view',
    templateUrl: './quantity-view.component.html'
})

export class QuantityViewComponent {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() quantity: Quantity[];
    @Input() multiValue: boolean;
    // single mode events
    @Output() onSelectChange = new EventEmitter();
    // edit mode events
    @Output() onValueAdded = new EventEmitter();
    @Output() onValueDeleted = new EventEmitter();

    addNewValue():void {
        this.quantity.push(UBLModelUtils.createQuantity());
        this.onValueAdded.emit();
    }

    removeValue(index:number):void {
        let value:number = this.quantity[index].value;
        this.quantity.splice(index, 1);
        this.onValueDeleted.emit(value);
    }

    selectChanged(event:any):void {
        this.onSelectChange.emit(event);
    }
}
