/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { Item } from "./item";
import { DeliveryTerms } from "./delivery-terms";
import { Package } from "./package";
import { UBLModelUtils } from "../ubl-model-utils";
import { Quantity } from './quantity';

export class GoodsItem {
    constructor(
        public id: string = null,
        public quantity: Quantity = new Quantity(),
        public item: Item = UBLModelUtils.createItem(),
        public containingPackage: Package = new Package(),
        public deliveryTerms: DeliveryTerms = new DeliveryTerms(),
        public sequenceNumberID: string = null,
        public grossWeightMeasure: Quantity = new Quantity(),
        public grossVolumeMeasure: Quantity = new Quantity()
    ) { }
}
