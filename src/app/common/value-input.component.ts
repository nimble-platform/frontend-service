import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import { Quantity } from "../catalogue/model/publish/quantity";
import { UnitService } from "./unit-service";

@Component({
    selector: "value-input",
    templateUrl: "./value-input.component.html",
    styleUrls: ["./value-input.component.css"],
})
export class ValueInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";
    @Input() type: "text" | "options" | "quantity" | "amount" | "file";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string;
    
    // Set if the input should be of type text.
    private textValue?: string;
    @Input() valueTextClass: string = "";
    @Output() textChange = new EventEmitter<string>();

    // Set if the input should be a drop down list.
    @Input() options?: string[];
    private selectedValue: string;
    @Output() selectedChange = new EventEmitter<string>();

    // Set if the input is a quantity
    @Input() quantity: Quantity;
    @Input() quantityUnits?: string[];
    @Input() quantityType?: string;
    @Input() disableQuantityUnit?: boolean = false;

    // Set if the input is a number
    @Input() amountValue?: number;
    @Output() amountChange = new EventEmitter<number>();
    @Input() amountUnit?: string;

    // Set if the input is a file
    @Output() onSelectFile: EventEmitter<File> = new EventEmitter();
    file: File;
    
    constructor(private unitService: UnitService) {

    }

    ngOnInit() {
        this.placeholder = this.type === "file" ? "Choose a file..." : "Enter a value...";
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }

        if(this.quantityType) {
            this.quantityUnits = ["Loading..."];
            this.unitService.getCachedUnitList(this.quantityType)
            .then(units => {
                this.quantityUnits = units;
            })
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

    @Input()
    get selected(): string {
        return this.selectedValue;
    }

    set selected(selected: string) {
        this.selectedValue = selected;
        this.selectedChange.emit(selected);
    }

    @Input()
    get amount(): number {
        return this.amountValue;
    }

    set amount(value: number) {
        this.amountValue = value;
        this.amountChange.emit(value);
    }

    onChooseFile(event: any): void {
        const fileList: FileList = event.target.files;
        this.file = fileList.length > 0 ? fileList[0] : null;
        this.onSelectFile.emit(this.file);
    }

    getFileName(): string {
        return this.file ? this.file.name : this.placeholder;
    }

    getFileClasses(): any {
        return {
            "no-file": !this.file,
            disabled: this.disabled
        };
    }
}
