import { Price } from "../catalogue/model/publish/price";
import { Quantity } from "../catalogue/model/publish/quantity";
import {currencyToString, roundToTwoDecimals} from "./utils";
import { ItemPriceWrapper } from "./item-price-wrapper";
import {defaultVatRate} from "./constants";
import {Item} from '../catalogue/model/publish/item';

/**
 * Wrapper around a price and a quantity, contains convenience methods to get the total price,
 * price per item and their string representations.
 *
 * This class can also be substituted for a Quantity.
 */
export class PriceWrapper {
    /** hjid field from Quantity class */
    //hjid: string = null;

    itemPrice: ItemPriceWrapper;

    constructor(public price: Price,
                public vatPercentage: number = defaultVatRate,
                public orderedQuantity: Quantity = new Quantity(1, price.baseQuantity.unitCode),
                public item:Item = null) {
        this.itemPrice = new ItemPriceWrapper(price);
    }

    get totalPrice(): number {
        if(!this.itemPrice.hasPrice()) {
            return 0;
        }

        const amount = Number(this.price.priceAmount.value);
        const baseQuantity = this.price.baseQuantity.value || 1;
        return this.orderedQuantity.value * amount / baseQuantity;
    }

    set totalPrice(price: number) {
        const quantity = this.orderedQuantity.value || 1;
        const baseQuantity = this.price.baseQuantity.value || 1;
        this.price.priceAmount.value = price / quantity * baseQuantity
    }

    get totalPriceString(): string {
        if(!this.itemPrice.hasPrice()) {
            return "Not specified";
        }
        return `${roundToTwoDecimals(this.totalPrice)} ${this.currency}`;
    }

    get pricePerItem(): number {
        return this.price.priceAmount.value / this.price.baseQuantity.value;
    }

    get pricePerItemString(): string {
        const amount = this.price.priceAmount;
        const qty = this.price.baseQuantity
        const baseQuantity = qty.value || 1;

        if(!amount.value || !qty.value) {
            return "On demand";
        }

        if(baseQuantity === 1) {
            return `${roundToTwoDecimals(amount.value)} ${currencyToString(amount.currencyID)} per ${qty.unitCode}`
        }
        return `${roundToTwoDecimals(amount.value)} ${currencyToString(amount.currencyID)} for ${baseQuantity} ${qty.unitCode}`
    }

    get vatTotal(): number {
        return this.totalPrice * this.vatPercentage / 100;
    }

    get vatTotalString(): string {
        return `${roundToTwoDecimals(this.vatTotal)} ${this.currency}`
    }

    get grossTotal(): number {
        return this.totalPrice + this.vatTotal;
    }

    get grossTotalString(): string {
        return `${roundToTwoDecimals(this.grossTotal)} ${this.currency}`;
    }

    get currency(): string {
        return currencyToString(this.price.priceAmount.currencyID);
    }

    set currency(currency: string) {
        this.price.priceAmount.currencyID = currency;
    }

    hasPrice(): boolean {
        // != here gives "not null or undefined", which is the behaviour we want.
        return (this.price.priceAmount.value != null && !isNaN(this.price.priceAmount.value));
    }

    /**
     * Getters/Setters for quantity
     */

    /*get value(): number {
        return this.totalPrice;
    }

    set value(value: number) {
        this.totalPrice = value;
    }

    get unitCode(): string {
        return this.currency;
    }

    set unitCode(unitCode: string) {
        this.currency = unitCode;
*/}
