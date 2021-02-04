/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
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

import { GoodsItem } from "./goods-item";
import { ItemLocationQuantity } from "./item-location-quantity";
import { Period } from "./period";
import { PriceOption } from "./price-option";
import {Quantity} from './quantity';
import {NonPublicInformation} from './non-public-information';

export class CatalogueLine {
    constructor(
        public id: string,
        public hjid: number,
        public orderableUnit: string,
        public freeOfChargeIndicator: boolean = null,
        public warrantyValidityPeriod: Period,
        public warrantyInformation: string[],
        public requiredItemLocationQuantity: ItemLocationQuantity,
        public priceOption: PriceOption[] = null,
        public goodsItem: GoodsItem,
        public minimumOrderQuantity:Quantity = new Quantity(),
        public priceHidden:boolean = false,
        public productStatusType:string = "PUBLISHED",
        public nonPublicInformation:NonPublicInformation[] = []
    ) { }
}
