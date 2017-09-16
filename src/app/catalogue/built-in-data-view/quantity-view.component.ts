import {Component, Input} from "@angular/core";
import {Quantity} from "../model/publish/quantity";

@Component({
    selector: 'quantity-view',
    templateUrl: './quantity-view.component.html'
})

export class QuantityViewComponent {
    @Input() editMode: boolean;
    @Input() propName: string;
    @Input() quantity: Quantity;
}
