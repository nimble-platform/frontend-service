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

import { ItemProperty } from "./item-property";
import { Party } from "./party";
import { BinaryObject } from "./binary-object";
import { CommodityClassification } from "./commodity-classification";
import { ItemIdentification } from "./item-identification";
import { Certificate } from "./certificate";
import { Dimension } from "./dimension";
import { DocumentReference } from "./document-reference";
import { TransportationService } from "./transportation-service";
import { TrackAndTraceDetails } from "./track-and-trace-details";
import { Text } from "./text";
import { LifeCyclePerformanceAssessmentDetails } from "./life-cycle-performance-assessment-details";

export class Item {
    constructor(
        public name: Text[] = [],
        public description: Text[] = [],
        public itemSpecificationDocumentReference: DocumentReference[] = [],
        public productImage: BinaryObject[] = [],
        public additionalItemProperty: ItemProperty[] = [],
        public manufacturerParty: Party = new Party(),
        public manufacturersItemIdentification: ItemIdentification = new ItemIdentification(),
        public catalogueDocumentReference: DocumentReference = new DocumentReference(),
        public commodityClassification: CommodityClassification[] = [],
        public certificate: Certificate[] = [],
        public dimension: Dimension[] = [],
        public transportationServiceDetails = new TransportationService(),
        public trackAndTraceDetails: TrackAndTraceDetails = new TrackAndTraceDetails(),
        public lifeCyclePerformanceAssessmentDetails: LifeCyclePerformanceAssessmentDetails = new LifeCyclePerformanceAssessmentDetails(),
        public customizable: boolean = null,
        public sparePart: boolean = null
    ) { }
}
