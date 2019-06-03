import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

@Component({
    selector: "expandable-flex-row",
    templateUrl: "./expandable-flex-row.component.html",
})
export class ExpandableFlexRow {

    @Input() content: string[] = [];
    @Input() shrinkElementSize = 2;
    expanded:boolean = false;


}
