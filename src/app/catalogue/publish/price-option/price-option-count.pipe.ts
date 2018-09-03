import {PRICE_OPTIONS} from "../../model/constants";
import {Pipe, PipeTransform} from "@angular/core";
import {PriceOption} from "../../model/publish/price-option";
/**
 * Created by suat on 28-Aug-18.
 */

@Pipe({name: 'priceOptionCountPipe'})
export class PriceOptionCountPipe implements PipeTransform {
    /**
     * Returns the count of price options specified by the price option category
     */
    transform(priceOptions: PriceOption[], priceOptionCategory: string): number {
        let count: number = 0;
        if(priceOptionCategory === PRICE_OPTIONS.ORDERED_QUANTITY) {
            for(let priceOption of priceOptions) {
                if(priceOption.minimumOrderQuantity) {
                    count++;
                }
            }

        } else if(priceOptionCategory === PRICE_OPTIONS.PRODUCT_PROPERTY) {
            for(let priceOption of priceOptions) {
                if(priceOption.itemProperty.length > 0) {
                    count++;
                }
            }

        } else if(priceOptionCategory === PRICE_OPTIONS.DELIVERY_PERIOD) {
            for(let priceOption of priceOptions) {
                if(priceOption.estimatedDeliveryPeriod) {
                    count++;
                }
            }

        } else if(priceOptionCategory === PRICE_OPTIONS.INCOTERM) {
            for(let priceOption of priceOptions) {
                if(priceOption.incoTerms.length > 0) {
                    count++;
                }
            }

        } else if(priceOptionCategory === PRICE_OPTIONS.PAYMENT_MEAN) {
            for(let priceOption of priceOptions) {
                if(priceOption.paymentMeans.length > 0) {
                    count++;
                }
            }

        } else if(priceOptionCategory === PRICE_OPTIONS.DELIVERY_LOCATION) {
            for(let priceOption of priceOptions) {
                if(priceOption.itemLocationQuantity.applicableTerritoryAddress.length > 0) {
                    count++;
                }
            }
        }
        return count;
    }
}