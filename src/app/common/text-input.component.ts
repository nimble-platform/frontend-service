import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

@Component({
    selector: "text-input",
    templateUrl: "./text-input.component.html",
    styleUrls: ["./text-input.component.css"],
})
export class TextInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "Enter a value...";

    private textValue: string;
    @Input() valueTextClass: string = "";
    @Output() textChange = new EventEmitter<string>();
    @Input() rows: number = 3;
    @Input() maxLength: string = "255";

    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    @Input()
    get text(): string {
        return this.textValue;
    }

    set text(text: string) {
        this.textValue = text;
        this.textChange.emit(text);
    }
}
