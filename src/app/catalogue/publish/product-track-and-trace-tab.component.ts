import { Component, OnInit, Input } from "@angular/core";
import { CatalogueLine } from "../model/publish/catalogue-line";

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
    }
}
