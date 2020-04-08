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

import { OrderLine } from "./order-line";
import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { Address } from "./address";
import { Period } from "./period";
import { Contract } from "./contract";
import { MonetaryTotal } from "./monetary-total";
import { DocumentReference } from './document-reference';
export class Order {
    constructor(
        public id: string = null,
        public note: string[] = [''],
        public requestedDeliveryPeriod: Period = new Period(),
        // DO NOT USE, this is not saved in the back end...
        // use order.orderLine[0].lineItem.deliveryTerms.deliveryLocation.address instead.
        public deliveryAddress: Address = new Address(),
        public contract: Contract[] = null,
        public buyerCustomerParty: CustomerParty = null,
        public sellerSupplierParty: SupplierParty = null,
        public anticipatedMonetaryTotal: MonetaryTotal = new MonetaryTotal(),
        public orderLine: OrderLine[] = null,
        public additionalDocumentReference: DocumentReference[] = []
    ) { }
}
