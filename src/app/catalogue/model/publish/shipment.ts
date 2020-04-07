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

import {ShipmentStage} from "./shipment-stage";
import {GoodsItem} from "./goods-item";
import {Address} from "./address";
import {TransportHandlingUnit} from "./transport-handling-unit";
import {Quantity} from "./quantity";
import {Consignment} from "./consignment";
import {Text} from "./text";
import {DocumentReference} from './document-reference';

export class Shipment {
    constructor(
        public handlingInstructions: Text[] = [],
        public totalTransportHandlingUnitQuantity: Quantity = new Quantity(),
        public consignment: Consignment[] = [new Consignment()],
        public goodsItem:GoodsItem[] = [new GoodsItem()],
        public shipmentStage: ShipmentStage[] = [],
        public transportHandlingUnit: TransportHandlingUnit[] = [new TransportHandlingUnit()],
        public originAddress: Address = new Address(),
        public specialInstructions: string[] = [''],
        public additionalDocumentReference:DocumentReference[] = []
    ) {  }

    selectHandlingInstructions(languageID: string): string {
        for (let pName of this.handlingInstructions) {
            if(pName.languageID === languageID) {
                return pName.value;
            }
        }

        return this.handlingInstructions[0].value;
    }
}
