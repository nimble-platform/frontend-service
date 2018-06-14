import { Component, EventEmitter, OnInit, Input, Output } from "@angular/core";

export interface Option {
    value: string;
    label: string;
}

@Component({
    selector: "negotiation-request-input",
    templateUrl: "./negotiation-request-input.component.html",
    styleUrls: ["./negotiation-request-input.component.css"],
})
export class NegotiationRequestInputComponent implements OnInit {

    @Input() label: string;
    // see https://blog.angulartraining.com/tutorial-create-your-own-two-way-data-binding-in-angular-46487650ea82 for this trick
    private cbModelValue: boolean;
    @Output() cbModelChange = new EventEmitter<boolean>();
    @Input() disabled: boolean = false;
    @Input() id: string;
    
    // Set if the input should be of type text.
    private textValue?: string;
    @Output() textChange = new EventEmitter<string>();

    // Set if the input should be a drop down list.
    @Input() options?: Option[];
    private selectedValue: string;
    @Output() selectedChange = new EventEmitter<string>();

    constructor() {

    }

    @Input()
    get cbModel(): boolean {
        return this.cbModelValue;
    }

    set cbModel(cbModel: boolean) {
        this.cbModelValue = cbModel;
        this.cbModelChange.emit(cbModel);
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

    ngOnInit() {
    }

}
