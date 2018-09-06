import { Component, EventEmitter, OnInit, Input, Output, OnChanges } from "@angular/core";
import { Quantity } from "../../../catalogue/model/publish/quantity";
import { UnitService } from "../../../common/unit-service";

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
    @Input() cbDisabled: boolean = false;
    @Input() disabled: boolean = false;
    @Input() invalid: boolean = false;
    @Input() id: string;
    
    // Set if the input should be of type text.
    private textValue?: string;
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
    
    constructor(private unitService: UnitService) {

    }

    ngOnInit() {
        if(this.quantityType) {
            this.quantityUnits = ["Loading..."];
            this.unitService.getCachedUnitList(this.quantityType)
            .then(units => {
                this.quantityUnits = units;
            })
        }
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

    @Input()
    get amount(): number {
        return this.amountValue;
    }

    set amount(value: number) {
        this.amountValue = value;
        this.amountChange.emit(value);
    }

    get formControlClass(): string {
        return this.invalid ? "ng-invalid" : "ng-valid";
    }
}
