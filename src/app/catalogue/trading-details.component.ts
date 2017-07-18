import {Component, Input} from "@angular/core";
import { CatalogueLine } from "./model/publish/catalogue-line";

@Component({
    selector: 'trading-details',
    templateUrl: './trading-details.component.html',
})

export class TradingDetailsComponent {

    @Input() catalogueLine: CatalogueLine;

}
