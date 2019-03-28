import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import {LANGUAGES} from '../catalogue/model/constants';

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
    @Input() flexClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "Enter a value...";
    @Input() addButtonStyle:string = "";
    @Input() deleteButtonStyle:string = "";

    private textValue: string;
    private languageIdValue: string;
    @Input() languageIdClass:String = "";
    @Input() valueTextClass: string = "";
    @Output() textChange = new EventEmitter<string>();
    @Output() languageIdChange = new EventEmitter<string>();
    @Output() addTextInput = new EventEmitter();
    @Output() deleteTextInput = new EventEmitter();
    @Input() rows: number = 3;
    @Input() maxLength: string = "255";

    languages = LANGUAGES;

    constructor() {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
    }

    @Input()
    get text(): string {
        if (this.presentationMode == "view") {
          let textBreaks = "";
          let textBreaksArr = [""];
          if (this.textValue && typeof(this.textValue) == "string") {
            textBreaksArr = this.textValue.split("\n");
          }
          if (textBreaksArr.length > 1)
            textBreaks = textBreaksArr.join("<br/>");
          else
            textBreaks = textBreaksArr[0];
          return textBreaks;
        }
        return this.textValue;
    }

    set text(text: string) {
        this.textValue = text;
        this.textChange.emit(text);
    }

    @Input()
    get languageId(): string{
        return this.languageIdValue;
    }

    set languageId(languageId: string){
        this.languageIdValue = languageId;
        this.languageIdChange.emit(languageId);
    }

    onAddTextInput(){
        this.addTextInput.emit();
    }

    onDeleteTextInput(){
        this.deleteTextInput.emit();
    }
}
