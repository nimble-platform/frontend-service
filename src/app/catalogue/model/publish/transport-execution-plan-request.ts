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

import { Party } from "./party";
import { Period } from "./period";
import { Consignment } from "./consignment";
import { Location } from "./location";
import { Item } from "./item";
import { Contract } from "./contract";
import { DocumentReference } from './document-reference';

export class TransportExecutionPlanRequest {
    constructor(
        public id: string = null,
        public note: string[] = [''],
        public transportUserParty: Party = new Party(),
        public transportContract: Contract = null,
        public transportServiceProviderParty: Party = new Party(),
        public mainTransportationService: Item = new Item(),
        public serviceStartTimePeriod: Period = new Period(),
        public serviceEndTimePeriod: Period = new Period(),
        public fromLocation: Location = new Location(),
        public toLocation: Location = new Location(),
        public consignment: Consignment[] = [new Consignment()],
        public additionalDocumentReference: DocumentReference[] = []
    ) { }
}
