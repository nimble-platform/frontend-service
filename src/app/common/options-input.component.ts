import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

export interface Option {
    name: string
    value: string
}

@Component({
    selector: "options-input",
    templateUrl: "./options-input.component.html",
    styleUrls: ["./options-input.component.css"],
})
export class OptionsInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    
    @Input() options: Array<string | Option>;
    private selectedValue: string;
    @Output() selectedChange = new EventEmitter<string>();

    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    @Input()
    get selected(): string {
        return this.selectedValue;
    }

    set selected(selected: string) {
        this.selectedValue = selected;
        this.selectedChange.emit(selected);
    }

    getValue(option: Option | string): string {
        return typeof option === "string" ? option : option.value;
    }

    getName(option: Option | string): string {
        return typeof option === "string" ? option : option.name;
    }
}
