/**
 * Created by suat on 12-May-17.
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
import {Text} from "./text";
import {LifeCyclePerformanceAssessmentDetails} from "./life-cycle-performance-assessment-details";

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
        public lifeCyclePerformanceAssessmentDetails: LifeCyclePerformanceAssessmentDetails = new LifeCyclePerformanceAssessmentDetails()
    ) {}
}
