import { Price } from "../catalogue/model/publish/price";
import { Quantity } from "../catalogue/model/publish/quantity";
import {currencyToString, roundToTwoDecimals} from "./utils";

/**
 * Wrapper for the price of a single item (or at least, for the base quantity of this item).
 * 
 * The aim of this class is to be a Quantity to be useable in all quantity based inputs.
 */
export class ItemPriceWrapper {
    /** hjid field from Quantity class */
    hjid: string = null;

    constructor(public price: Price) {

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

    /**
     * Getters/Setters for quantity
     */

    get value(): number {
        return this.price.priceAmount.value;
    }

    set value(value: number) {
        this.price.priceAmount.value = value;
    }

    get unitCode(): string {
        return this.currency;
    }

    set unitCode(unitCode: string) {
        this.currency = unitCode;
    }
}