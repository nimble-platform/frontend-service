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

import { Quantity } from "./quantity";
import { Item } from "./item";
import { Price } from "./price";
import { LineReference } from "./line-reference";
import { Period } from "./period";
import { DeliveryTerms } from "./delivery-terms";
import { Delivery } from "./delivery";
import { PaymentMeans } from './payment-means';
import { PaymentTerms } from './payment-terms';
import { TradingTerm } from './trading-term';
import { Clause } from './clause';

export class LineItem {
    constructor(
        public quantity: Quantity = new Quantity(),
        public warrantyInformation: string[] = [],
        public delivery: Delivery[] = [new Delivery()],
        public deliveryTerms: DeliveryTerms = new DeliveryTerms(),
        public price: Price = new Price(),
        public item: Item = new Item(),
        public warrantyValidityPeriod: Period = new Period(),
        public lineReference: LineReference[] = [new LineReference()],
        public dataMonitoringRequested: boolean,
        public paymentMeans: PaymentMeans,
        public paymentTerms: PaymentTerms,
        public tradingTerms: TradingTerm[],
        public clause: Clause[] = [],
    ) { }
}
