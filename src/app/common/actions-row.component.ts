import { Component, Input } from "@angular/core";
import { Location } from "@angular/common";
import { ActionsRowSlot } from "./action-row-slot";

/**
 * Anthony: this component is to normalize all the actions (in particular in the business processes screens).
 * At the moment, this is not used.
 */
@Component({
    selector: "actions-row",
    templateUrl: "./actions-row.component.html",
    styleUrls: ["./actions-row.component.css"],
})
export class ActionsRowComponent {

    @Input() slots: ActionsRowSlot[];

    constructor(private location: Location) {

    }

    onButtonClick(index: number): void {
        const onclick = this.slots[index].onclick;
        if(onclick) {
            onclick();
        }
    }

    onBack(): void {
        this.location.back()
    }

    getSlotClass(slot: ActionsRowSlot): any {
        return {
            "cal-status-col": slot.type === "callStatus",
            "button-col": slot.type === "button" || slot.type === "back",
            "text-col": slot.type === "text"
        }
    }
}