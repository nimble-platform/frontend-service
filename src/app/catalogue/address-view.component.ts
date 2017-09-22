import {Component, Input} from "@angular/core";
import {Address} from "./model/publish/address";
/**
 * Created by suat on 22-Sep-17.
 */

@Component({
    selector: 'address-view',
    templateUrl: './address-view.component.html'
})

export class AddressViewComponent {
    @Input() address: Address[];
    @Input() propName: string;
    @Input() presentationMode: string;

}
