import {PRICE_OPTIONS} from "../../model/constants";
import {Pipe, PipeTransform} from "@angular/core";
import {PriceOption} from "../../model/publish/price-option";
/**
 * Created by suat on 28-Aug-18.
 */

@Pipe({name: 'priceOptionPipe'})
export class PriceOptionPipe implements PipeTransform {
    /**
     * Returns the subset of price options specified by the price option category
     * in the form of {option: optionObject, index: index}
     */
    transform(allPriceOptions: PriceOption[], priceOptionCategory: string): any[] {
        let priceOptionsWithIndices: any[] = [];
        if (priceOptionCategory === PRICE_OPTIONS.ORDERED_QUANTITY) {
            for (let i:number = 0; i<allPriceOptions.length; i++) {
                let priceOption:PriceOption = allPriceOptions[i];
                if (priceOption.minimumOrderQuantity) {
                    priceOptionsWithIndices.push({option: priceOption, index: i});
                }
            }

        } else if (priceOptionCategory === PRICE_OPTIONS.PRODUCT_PROPERTY) {
            for (let i:number = 0; i<allPriceOptions.length; i++) {
                let priceOption:PriceOption = allPriceOptions[i];
                if (priceOption.itemProperty.length > 0) {
                    priceOptionsWithIndices.push({option: priceOption, index: i});
                }
            }

        } else if (priceOptionCategory === PRICE_OPTIONS.DELIVERY_PERIOD) {
            for (let i:number = 0; i<allPriceOptions.length; i++) {
                let priceOption:PriceOption = allPriceOptions[i];
                if (priceOption.estimatedDeliveryPeriod) {
                    priceOptionsWithIndices.push({option: priceOption, index: i});
                }
            }

        } else if (priceOptionCategory === PRICE_OPTIONS.INCOTERM) {
            for (let i:number = 0; i<allPriceOptions.length; i++) {
                let priceOption:PriceOption = allPriceOptions[i];
                if (priceOption.incoTerms.length > 0) {
                    priceOptionsWithIndices.push({option: priceOption, index: i});
                }
            }

        } else if (priceOptionCategory === PRICE_OPTIONS.PAYMENT_MEAN) {
            for (let i:number = 0; i<allPriceOptions.length; i++) {
                let priceOption:PriceOption = allPriceOptions[i];
                if (priceOption.paymentMeans.length > 0) {
                    priceOptionsWithIndices.push({option: priceOption, index: i});
                }
            }

        } else if (priceOptionCategory === PRICE_OPTIONS.DELIVERY_LOCATION) {
            for (let i:number = 0; i<allPriceOptions.length; i++) {
                let priceOption:PriceOption = allPriceOptions[i];
                if (priceOption.itemLocationQuantity.applicableTerritoryAddress.length > 0) {
                    priceOptionsWithIndices.push({option: priceOption, index: i});
                }
            }
        }
        return priceOptionsWithIndices;
    }
}