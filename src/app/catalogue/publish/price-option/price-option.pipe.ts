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
    transform(allPriceOptions: PriceOption[], priceOptionType: number): any[] {
        let priceOptionsWithIndices: any[] = [];
        for(let i:number = 0; i<allPriceOptions.length;i++){
            let option = allPriceOptions[i];
            if(option.typeID == priceOptionType){
                priceOptionsWithIndices.push({option: option,index:i});
            }
        }
        return priceOptionsWithIndices;
    }
}