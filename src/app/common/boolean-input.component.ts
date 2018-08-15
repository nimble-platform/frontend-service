import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

@Component({
    selector: "boolean-input",
    templateUrl: "./boolean-input.component.html",
    styleUrls: ["./boolean-input.component.css"],
})
export class BooleanInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    
    private booleanValue: boolean;
    @Output() booleanChange = new EventEmitter<boolean>();

    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    @Input()
    get value(): boolean {
        return this.booleanValue;
    }

    set value(value: boolean) {
        this.booleanValue = value;
        this.booleanChange.emit(value);
    }
}
