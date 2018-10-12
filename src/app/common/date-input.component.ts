import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

@Component({
    selector: "date-input",
    templateUrl: "./date-input.component.html",
})
export class DateInputComponent implements OnInit {

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
    
    @Input() valueDateClass: string = "";
    
    private dateValue: string;
    @Output() dateChange = new EventEmitter<string>();

    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    @Input()
    get date(): string {
        return this.dateValue;
    }

    set date(date: string) {
        if(date){
            let index = date.indexOf("T");
            if (index != -1){
                date = date.substring(0,date.indexOf("T"));
            }
        }
        this.dateValue = date;
        this.dateChange.emit(date);
    }
}
