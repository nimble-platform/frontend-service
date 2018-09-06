import { Component, Input } from "@angular/core";

@Component({
    selector: "input-label",
    templateUrl: "./input-label.component.html",
    styleUrls: ["./input-label.component.css"]
})
export class InputLabelComponent {

    @Input() label: string;
    @Input() definition: string;
    @Input() class: string = "";

    constructor() {

    }

}
