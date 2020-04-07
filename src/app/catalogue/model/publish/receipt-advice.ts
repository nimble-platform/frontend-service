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

import {GoodsItem} from "./goods-item";
import {ItemLocationQuantity} from "./item-location-quantity";
import {Period} from "./period";
import {LineItem} from "./line-item";
import {OrderReference} from "./order-reference";
import {DespatchLine} from "./despatch-line";
import {DocumentReference} from "./document-reference";
import {ReceiptLine} from "./receipt-line";
import {SupplierParty} from "./supplier-party";
import {CustomerParty} from "./customer-party";

export class ReceiptAdvice {
    constructor(
        public id: string = null,
        public note:string[] = [""],
        public orderReference:OrderReference[] = null,
        public despatchDocumentReference:DocumentReference[] = null,
        public deliveryCustomerParty:CustomerParty = null,
        public despatchSupplierParty:SupplierParty = null,
        public receiptLine:ReceiptLine[] = null,
        public additionalDocumentReference:DocumentReference[] = []
    ) {  }
}
