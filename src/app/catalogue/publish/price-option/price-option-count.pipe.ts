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
    transform(priceOptions: PriceOption[], priceOptionType: number): number {
        let count: number = 0;
        for(let option of priceOptions){
            if(option.typeID == priceOptionType){
                count++;
            }
        }
        return count;
    }
}