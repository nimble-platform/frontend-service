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

import { CustomerParty } from "./customer-party";
import { SupplierParty } from "./supplier-party";
import { RequestForQuotationLine } from "./request-for-quotation-line";
import { Delivery } from "./delivery";
import { DocumentReference } from './document-reference';

export class RequestForQuotation {
    constructor(
        public id: string,
        public note: string[] = [''],
        public buyerCustomerParty: CustomerParty,
        public sellerSupplierParty: SupplierParty,
        public delivery: Delivery,
        public requestForQuotationLine: RequestForQuotationLine[],
        public additionalDocumentReference: DocumentReference[] = []
    ) { }
}
