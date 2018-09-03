import {Component, OnInit, Input} from "@angular/core";
import {CatalogueLine} from "../model/publish/catalogue-line";
import {CURRENCIES, DISCOUNT_TARGETS, DISCOUNT_UNITS, PRICE_OPTIONS} from "../model/constants";
import {PriceOptionCountPipe} from "./price-option-count.pipe";
import {PriceOption} from "../model/publish/price-option";
import {Quantity} from "../model/publish/quantity";
import {PriceOptionPipe} from "./price-option.pipe";
import {AllowanceCharge} from "../model/publish/allowance-charge";

@Component({
    selector: "product-price-tab",
    templateUrl: "./product-price-tab.component.html",
    styleUrls: ["./product-price-tab.component.css"],
    providers: [PriceOptionCountPipe, PriceOptionPipe],
})
export class ProductPriceTabComponent implements OnInit {

    @Input() catalogueLine: CatalogueLine;
    @Input() disabled: boolean

    // TODO: later, get these from a service?
    CURRENCIES = CURRENCIES;
    priceOptions = PRICE_OPTIONS;
    discountTargets = DISCOUNT_TARGETS;
    discountUnits = DISCOUNT_UNITS;
    object = Object;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }

    addPriceOption(priceOptionCategory: string): void {
        let priceOption: PriceOption = new PriceOption();
        if (priceOptionCategory == PRICE_OPTIONS.ORDERED_QUANTITY) {
            priceOption.minimumOrderQuantity = new Quantity(this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value, this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode);
        }
        this.catalogueLine.priceOption.push(priceOption);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
    }

    removePriceOption(index: number): void {
        this.catalogueLine.priceOption.splice(index, 1);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
    }

    changeDiscountTarget(discountTarget: string, allowanceCharge: AllowanceCharge): void {
        if(discountTarget == DISCOUNT_TARGETS.PER_ITEM) {
            
        } else {

        }
    }
}
