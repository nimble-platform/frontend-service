/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Pipe, PipeTransform } from "@angular/core";
import { PriceOption } from "../../catalogue/model/publish/price-option";

@Pipe({ name: 'priceOptionPipe' })
export class PriceOptionPipe implements PipeTransform {
    /**
     * Returns the subset of price options specified by the price option category
     * in the form of {option: optionObject, index: index}
     */
    transform(allPriceOptions: PriceOption[], priceOptionType: number): any[] {
        let priceOptionsWithIndices: any[] = [];
        for (let i: number = 0; i < allPriceOptions.length; i++) {
            let option = allPriceOptions[i];
            if (option.typeID == priceOptionType) {
                priceOptionsWithIndices.push({ option: option, index: i });
            }
        }
        return priceOptionsWithIndices;
    }
}
