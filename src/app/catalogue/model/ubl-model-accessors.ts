import { ItemLocationQuantity } from "./publish/item-location-quantity";
import { Quantity } from "./publish/quantity";
import { Period } from "./publish/period";
import { Price } from "./publish/price";

/**
 * Utility class that contains getters and setters for models.
 * This class also contains methods to transform complex objects (such as price) to a string representation.
 */
export class UblModelAccessors {
    
    private static MAX_PRICE = 100000;

    private static STEPS_FOR_PRICE = 100;

    static hasPrice(itemLocationQuantity: ItemLocationQuantity): boolean {
        const price = itemLocationQuantity.price;
        return !!price.priceAmount.value;
    }

    static getTotalPrice(itemLocationQuantity: ItemLocationQuantity, quantity: number): number {
        if(!this.hasPrice(itemLocationQuantity)) {
            return 0;
        }
        const price = itemLocationQuantity.price;
        const amount = Number(price.priceAmount.value);
        const baseQuantity = price.baseQuantity.value || 1;
        return quantity * amount / baseQuantity;
    }

    static getTotalPriceString(itemLocationQuantity: ItemLocationQuantity, quantity: number): string {
        return this.getTotalPrice(itemLocationQuantity, quantity) + " " + itemLocationQuantity.price.priceAmount.currencyID;
    }

    static getPricePerItemString(price: Price): string {
        const amount = price.priceAmount;
        const qty = price.baseQuantity
        const baseQuantity = qty.value || 1;

        if(!amount.value || !qty.value) {
            return "On demand";
        }

        if(baseQuantity === 1) {
            return `${amount.value} ${amount.currencyID} per ${qty.unitCode}`
        }
        return `${amount.value} ${amount.currencyID} for ${baseQuantity} ${qty.unitCode}`
    }

    static getPeriodString(period: Period): string {
        return this.getDurationString(period.durationMeasure);
    }

    private static getDurationString(duration: Quantity): string {
        if(duration.value > 0) {
            return duration.value + " " + duration.unitCode;
        }
        return "None";
    }

    static getMaximumQuantityForPrice(price: Price): number {
        if(!price || !price.priceAmount.value) {
            return 100;
        }

        let result = this.MAX_PRICE / price.priceAmount.value;
        return this.roundFirstDigit(result) * this.getMagnitude(result);
    }

    static getStepForPrice(price: Price): number {
        return this.getMaximumQuantityForPrice(price) / this.STEPS_FOR_PRICE;
    }

    private static getMagnitude(value: number): number {
        return Math.pow(10, Math.floor(Math.log10(value)));
    }

    private static round5(value: number): number {
        return Math.round(value / 5) * 5;
    }

    // rounds the first digit of a number to the nearest 5 or 10
    private static roundFirstDigit(value: number): number {
        let roundedDigit = this.round5(value / this.getMagnitude(value));
        if(roundedDigit == 0) {
            roundedDigit = 1;
        }
        return roundedDigit;
    }
}