import { Price } from "../../catalogue/model/publish/price";
import { Quantity } from "../../catalogue/model/publish/quantity";

/**
 * Wrapper around a price and a quantity, contains convenience methods to get the total price, 
 * price per item and their string representations.
 */
export class PriceWrapper {

    constructor(public price: Price,
                public quantity: Quantity = new Quantity(1, price.baseQuantity.unitCode)) {

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

    get pricePerItemString(): string {
        const amount = this.price.priceAmount;
        const qty = this.price.baseQuantity
        const baseQuantity = qty.value || 1;

        if(!amount.value || !qty.value) {
            return "On demand";
        }

        if(baseQuantity === 1) {
            return `${this.roundPrice(amount.value)} ${amount.currencyID} per ${qty.unitCode}`
        }
        return `${this.roundPrice(amount.value)} ${amount.currencyID} for ${baseQuantity} ${qty.unitCode}`
    }

    get currency(): string {
        return this.price.priceAmount.currencyID;
    }
    
    hasPrice(): boolean {
        return !!this.price.priceAmount.value;
    }

    private roundPrice(value: number): number {
        return Math.round(value * 100) / 100;
    }
}