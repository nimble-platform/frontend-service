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

import { Period } from "./period";
import { ItemProperty } from "./item-property";
import { ItemLocationQuantity } from "./item-location-quantity";
import { PaymentTerms } from "./payment-terms";
import { PaymentMeans } from './payment-means';

export class PriceOption {
    constructor(
        public typeID: number = null,
        public incoterms: string[] = null,
        public estimatedDeliveryPeriod: Period = null,
        public additionalItemProperty: ItemProperty[] = null,
        public paymentMeans: PaymentMeans[] = null,
        public paymentTerms: PaymentTerms = null,
        public itemLocationQuantity: ItemLocationQuantity = new ItemLocationQuantity(),
        public discount: number = 0
    ) { }
}
