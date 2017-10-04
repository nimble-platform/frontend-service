import {Component, Input} from "@angular/core";
import {Quantity} from "../model/publish/quantity";
import {Subject} from "rxjs/Subject";
import {Amount} from "../model/publish/amount";

@Component({
    selector: 'amount-view',
    templateUrl: './amount-view.component.html'
})

export class AmountViewComponent {
    @Input() presentationMode: string;
    @Input() propName: string;
    @Input() amount: Amount[];

}
