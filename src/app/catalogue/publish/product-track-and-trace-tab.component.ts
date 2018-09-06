import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";
import {TrackAndTraceDetails} from '../model/publish/track-and-trace-details';

@Component({
    selector: "product-track-and-trace-tab",
    templateUrl: "./product-track-and-trace-tab.component.html"
})
export class ProductTrackAndTraceTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    constructor() {
    }

    ngOnInit() {
        // nothing for now
        if(this.catalogueLine.goodsItem.item.trackAndTraceDetails == null){
            this.catalogueLine.goodsItem.item.trackAndTraceDetails = new TrackAndTraceDetails();
        }
    }
}
