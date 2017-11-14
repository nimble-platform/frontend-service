/**
 * Created by suat on 12-May-17.
 */

import {ItemProperty} from "./item-property";
import {Party} from "./party";
import {BinaryObject} from "./binary-object";
import {CommodityClassification} from "./commodity-classification";
import {ItemIdentification} from "./item-identification";
import {Country} from "./country";
import {Certificate} from "./certificate";
import {Dimension} from "./dimension";
import {Period} from "./period";
import {DocumentReference} from "./document-reference";
import {TransportationService} from "./transportation-service";
import {TransportationServiceDetails} from "../../ubl-model-view/catalogue-line/transportation-service-details.component";

export class Item {
    constructor(
        public name: string = null,
        public description: string = null,
        public productImage:BinaryObject[] = [],
        public freeOfChargeIndicator: boolean = null,
        public additionalItemProperty: ItemProperty[] = [],
        public manufacturerParty: Party = new Party(),
        public manufacturersItemIdentification: ItemIdentification = new ItemIdentification(),
        public catalogueDocumentReference: DocumentReference = new DocumentReference(),
        public originCountry: Country = new Country(),
        public commodityClassification: CommodityClassification[] = [],
        public certificate: Certificate[] = [],
        public dimension: Dimension[] = [],
        public transportationServiceDetails = new TransportationService(),
        public hjid: string = null,

        // for demo
        public itemConfigurationImageArray:BinaryObject[] = null,
        public itemConfigurationImages:string = null,
    ) {  }
}
