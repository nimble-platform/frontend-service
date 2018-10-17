import {Component, OnInit, Input} from "@angular/core";
import {CatalogueLine} from "../model/publish/catalogue-line";
import {CURRENCIES, DISCOUNT_TARGETS, DISCOUNT_UNITS, PRICE_OPTIONS} from "../model/constants";
import {PriceOptionCountPipe} from "./price-option/price-option-count.pipe";
import {PriceOption} from "../model/publish/price-option";
import {Quantity} from "../model/publish/quantity";
import {PriceOptionPipe} from "./price-option/price-option.pipe";
import {AllowanceCharge} from "../model/publish/allowance-charge";
import {Amount} from "../model/publish/amount";
import {Period} from '../model/publish/period';

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
    object = Object;

    constructor() {
    }

    ngOnInit() {
        // nothing for now
    }

    addPriceOption(priceOptionType: any): void {
        let priceOption: PriceOption = new PriceOption();

        priceOption.typeID = priceOptionType;

        if (priceOptionType == PRICE_OPTIONS.ORDERED_QUANTITY.typeID) {
            priceOption.itemLocationQuantity.minimumQuantity = new Quantity(this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.value, this.catalogueLine.requiredItemLocationQuantity.price.baseQuantity.unitCode);

        } else if(priceOptionType == PRICE_OPTIONS.PRODUCT_PROPERTY.typeID) {
            priceOption.itemProperty = [];
        } else if(priceOptionType == PRICE_OPTIONS.INCOTERM.typeID){
            priceOption.incoterms = [];
        } else if(priceOptionType == PRICE_OPTIONS.PAYMENT_MEAN.typeID){
            priceOption.paymentMeans = [];
        } else if(priceOptionType == PRICE_OPTIONS.DELIVERY_LOCATION.typeID){
            priceOption.itemLocationQuantity.applicableTerritoryAddress = [];
        } else if(priceOptionType == PRICE_OPTIONS.DELIVERY_PERIOD.typeID){
            priceOption.estimatedDeliveryPeriod = new Period();
        }

        this.catalogueLine.priceOption.push(priceOption);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
    }

    removePriceOption(index: number): void {
        this.catalogueLine.priceOption.splice(index, 1);
        this.catalogueLine.priceOption = [].concat(this.catalogueLine.priceOption);
    }

    printPriceOptions(): void {
        console.log(this.catalogueLine.priceOption);
    }
}
