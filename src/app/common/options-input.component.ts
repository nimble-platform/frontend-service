import {Component, EventEmitter, OnInit, Input, Output, ViewChild, ElementRef} from "@angular/core";

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
    @Input() selectedIndex: number = -1; // this is added just to initialize the selected properly in case there are multiple options with the same value
    private selectedValue: string;
    @Output() selectedChange = new EventEmitter<string>();
    @Output() selectedOptionChange = new EventEmitter<string|Option>(); // selected option is kept since at some places the option itself is required. e.g. we want to make a distinction
                                                                        // between image and file property qualifiers

    @Input() large: string = "false";
    innerFormClass = "form-control-sm";
    @ViewChild('optionsInputSelect') optionsInputSelect;

    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        if (this.large == "true")
          this.innerFormClass = "";
        else
          this.innerFormClass = "form-control-sm";
    }

    ngAfterViewInit() {
        if(this.selectedIndex != -1) {
            setTimeout((()=>{
                this.optionsInputSelect.nativeElement.selectedIndex = this.selectedIndex;
            }), 0);
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

    onChange(event): void {
        this.selectedIndex = event.target.selectedIndex;
        let selectedOption = this.options[this.selectedIndex];

        // emit also the selected option itself
        this.selectedOptionChange.emit(selectedOption);
    }

    getValue(option: Option | string): string {
        if(option){
            return typeof option === "string" ? option : option.value;
        }
        if(option == ""){
            return ""
        }
    }

    getName(option: Option | string): string {
        if(option){
            return typeof option === "string" ? option : option.name;
        }
    }
}
