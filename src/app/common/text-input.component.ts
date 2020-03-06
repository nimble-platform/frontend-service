import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";
import {LANGUAGES} from '../catalogue/model/constants';
import {TranslateService} from '@ngx-translate/core';
import {UBLModelUtils} from '../catalogue/model/ubl-model-utils';
import {ChildFormBase} from './validation/child-form-base';
import {AbstractControl, FormControl, Validators} from '@angular/forms';
import {ValidatorFn} from '@angular/forms/src/directives/validators';
import {ValidationService} from './validation/validators';

const TEXT_INPUT_FIELD_NAME = 'text';
@Component({
    selector: "text-input",
    templateUrl: "./text-input.component.html",
    styleUrls: ["./text-input.component.css"],
})
export class TextInputComponent extends ChildFormBase implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() flexClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "...";
    @Input() addButtonStyle:string = "";
    @Input() deleteButtonStyle:string = "";

    private textValue: string;
    private languageIdValue: string;
    @Input() languageIdClass:String = "";
    @Input() valueTextClass: string = "";
    @Input() textGeneratorClass:string = "";
    @Output() textChange = new EventEmitter<string>();
    @Output() languageIdChange = new EventEmitter<string>();
    @Output() addTextInput = new EventEmitter();
    @Output() deleteTextInput = new EventEmitter();
    @Input() rows: number = 3;
    @Input() maxLength: string = "255";

    textInputFormControl: FormControl;

    languages = LANGUAGES;

    constructor(private validationService: ValidationService,
                private translate: TranslateService) {
        super();
    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }
        this.initViewFormAndAddToParentForm();
    }

    ngOnDestroy() {
        this.removeViewFormFromParentForm();
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

    generateText(){
       this.text = UBLModelUtils.generateUUID();
    }

    initializeForm(): void {
        let validators: ValidatorFn[] = [Validators.maxLength(Number(this.maxLength))];
        if (this.required) {
            validators.push(Validators.required);
        }

        this.textInputFormControl = new FormControl(this.text, validators);
        this.formGroup.addControl(TEXT_INPUT_FIELD_NAME, this.textInputFormControl);
    }

    getValidationErrorMessage(formControl: AbstractControl): string {
        return this.validationService.getValidationErrorMessage(formControl);
    }
}
