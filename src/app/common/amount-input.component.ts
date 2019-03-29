import {Component, Input, OnInit} from "@angular/core";
import {UnitService} from "./unit-service";
import {amountToString} from "./utils";
import {Amount} from "../catalogue/model/publish/amount";

@Component({
    selector: "amount-input",
    templateUrl: "./amount-input.component.html",
    styleUrls: ["./amount-input.component.css"],
})
export class AmountInputComponent implements OnInit {

    @Input() visible: boolean = true;
    @Input() disabled: boolean = false;
    @Input() presentationMode: "edit" | "view" = "edit";

    @Input() label: string;
    @Input() definition: string;
    @Input() labelClass: string = "col-3";
    @Input() labelMainClass: string = "";
    @Input() rowClass: string = "";
    @Input() valueClass: string; // set based on label
    @Input() placeholder: string = "Enter value here...";
    @Input() unitPlaceholder: string = "Unit";
    @Input() valueTextClass: string = "";
    
    @Input() amount: Amount;
    @Input() amountCurrencies?: string[];
    @Input() amountType?: string;
    @Input() disableAmountCurrency: boolean = false;

    constructor(private unitService: UnitService) {

    }

    ngOnInit() {
        if (!this.valueClass) {
            this.valueClass = this.label ? "col-9" : "col-12";
        }

        if (this.amountType) {
            this.amountCurrencies = ["Loading..."];
            this.unitService.getCachedUnitList(this.amountType)
                .then(units => {
                    this.amountCurrencies = units;
                    this.initAmountCurrency();
                });
        } else {
            if (this.amountCurrencies != null && this.amountCurrencies.length > 0) {
                this.initAmountCurrency();
            }
        }
    }

    private initAmountCurrency(): void {
        if(this.amount.currencyID == null && this.amountCurrencies != null){
            this.amount.currencyID = this.amountCurrencies[0];
        }
    }

    amountToString(): string {
        return amountToString(this.amount);
    }
}
