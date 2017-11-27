/**
 * Created by suat on 15-Nov-17.
 */
import {Component, Input} from "@angular/core";
import {CatalogueLine} from "../../catalogue/model/publish/catalogue-line";
import {BPDataService} from "./bp-data-service";

@Component({
    selector: 'bp-product-details',
    templateUrl: './bp-product-details.component.html'
})

export class BpProductDetailsComponent {
    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;
    @Input() selectedTab: string;
}