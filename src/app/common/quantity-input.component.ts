import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import { Quantity } from "../catalogue/model/publish/quantity";
import { UnitService } from "./unit-service";
import { quantityToString } from "./utils";

@Component({
    selector: "quantity-input",
    templateUrl: "./quantity-input.component.html",
    styleUrls: ["./quantity-input.component.css"],
})
export class QuantityInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() valueSizeClass: string = "col-7";
    @Input() unitSizeClass: string = "col-5";
    @Input() placeholder: string = "Enter value here...";
    @Input() unitPlaceholder: string = "Unit";
    @Input() valueTextClass: string = "";

    @Input() quantity: Quantity;
    @Output() onQuantityValueChange = new EventEmitter<number>();
    @Input() quantityUnits?: string[];
    @Input() quantityType?: string;
    @Input() disableQuantityUnit: boolean = false;
    @Input() step: number = 1;
    @Input() large: string = "false";
    innerFormClass = "form-control-sm";

    constructor(private unitService: UnitService) {

    }

    ngOnInit() {
        if(!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }

        if (this.large == "true")
          this.innerFormClass = "";
        else
          this.innerFormClass = "form-control-sm";

        if(this.quantityType) {
            this.quantityUnits = ["Loading..."];
            this.unitService.getCachedUnitList(this.quantityType)
            .then(units => {
                this.quantityUnits = units;
                this.initQuantityUnit();
            })
        } else if(this.quantityUnits != null && this.quantityUnits.length > 0) {
            this.initQuantityUnit();
        }
    }

    private initQuantityUnit(): void {
        if(this.quantity.unitCode == null && this.quantityUnits != null){
            this.quantity.unitCode = this.quantityUnits[0];
        }
    }

    onQuantityValueChanged(value: number) {
        this.onQuantityValueChange.emit(value);
    }

    quantityToString(): string {
        return quantityToString(this.quantity);
    }
}
