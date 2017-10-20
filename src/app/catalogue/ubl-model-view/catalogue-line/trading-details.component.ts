import {Component, Input} from "@angular/core";
import { CatalogueLine } from "../../model/publish/catalogue-line";

@Component({
    selector: 'trading-details',
    templateUrl: './trading-details.component.html',
})

// Component that displays warranty information etc. inside the "trading details" tab in CatalogueLineView
export class TradingDetailsComponent {
    @Input() presentationMode:string;
    @Input() catalogueLine: CatalogueLine;
    @Input() editPrice:boolean;

    debugg():void {
        console.log(this.catalogueLine);
    }
}
