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

import { Quantity } from '../catalogue/model/publish/quantity';
import { Address } from '../catalogue/model/publish/address';
import { TradingTerm } from '../catalogue/model/publish/trading-term';
import { Clause } from '../catalogue/model/publish/clause';

export class CommonTerms {
    constructor(
        public deliveryPeriod: Quantity,
        public warrantyPeriod: Quantity,
        public incoTerm: string,
        public paymentTerm: string,
        public paymentMean: string,
        public dataMonitoringRequested: boolean,
        public frameContractDuration: Quantity,
        public deliveryAddress: Address,
        public tradingTerms: TradingTerm[],
        public clauses: Clause[],
        public areDefaultTermsAndConditions: boolean // whether the clauses are the default ones of the platform or not
    ) { }
}
