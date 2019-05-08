import { Price } from "../catalogue/model/publish/price";
import { Quantity } from "../catalogue/model/publish/quantity";
import { currencyToString } from "./utils";
import { ItemPriceWrapper } from "./item-price-wrapper";
import {Amount} from "../catalogue/model/publish/amount";

/**
 * Wrapper around a price and a quantity, contains convenience methods to get the total price,
 * price per item and their string representations.
 *
 * This class can also be substituted for a Quantity.
 */
export class PriceWrapper {
    /** hjid field from Quantity class */
    hjid: string = null;

    itemPrice: ItemPriceWrapper;

    constructor(public price: Price,
                public quantity: Quantity = new Quantity(1, price.baseQuantity.unitCode)) {
        this.itemPrice = new ItemPriceWrapper(price);
    }

    get totalPrice(): number {
        if(!this.hasPrice()) {
            return 0;
        }

        const amount = Number(this.price.priceAmount.value);
        const baseQuantity = this.price.baseQuantity.value || 1;
        return this.roundPrice(this.quantity.value * amount / baseQuantity);
    }

    set totalPrice(price: number) {
        const quantity = this.quantity.value || 1;
        const baseQuantity = this.price.baseQuantity.value || 1;
        this.price.priceAmount.value = price / quantity * baseQuantity
    }

    get totalPriceString(): string {
        if(!this.hasPrice()) {
            return "Not specified";
        }
        return `${this.totalPrice} ${this.currency}`;
    }

    get pricePerItem(): number {
        return this.price.priceAmount.value;
    }

    get pricePerItemString(): string {
        const amount = this.price.priceAmount;
        const qty = this.price.baseQuantity
        const baseQuantity = qty.value || 1;

        if(!amount.value || !qty.value) {
            return "On demand";
        }

        if(baseQuantity === 1) {
            return `${this.roundPrice(amount.value)} ${currencyToString(amount.currencyID)} per ${qty.unitCode}`
        }
        return `${this.roundPrice(amount.value)} ${currencyToString(amount.currencyID)} for ${baseQuantity} ${qty.unitCode}`
    }

    get currency(): string {
        return currencyToString(this.price.priceAmount.currencyID);
    }

    set currency(currency: string) {
        this.price.priceAmount.currencyID = currency;
    }

    hasPrice(): boolean {
        // != here gives "not null or undefined", which is the behaviour we want.
        return this.price.priceAmount.value != null;
    }

    private roundPrice(value: number): number {
        return Math.round(value * 100) / 100;
    }

    /**
     * Getters/Setters for quantity
     */

    get value(): number {
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
    }
}