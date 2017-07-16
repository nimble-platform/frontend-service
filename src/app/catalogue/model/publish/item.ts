/**
 * Created by suat on 12-May-17.
 */

import {AdditionalItemProperty} from "./additional-item-property";
import {Party} from "./party";
import {BinaryObject} from "./binary-object";
import {CommodityClassification} from "./commodity-classification";
import {ItemIdentification} from "./item-identification";
import {Country} from "./country";
import {Certificate} from "./certificate";
import {Dimension} from "./dimension";

export class Item {
    constructor(
        public name: string,
        public description: string,
        public freeOfChargeIndicator: boolean,
        public additionalItemProperty: AdditionalItemProperty[], // TODO this is of ItemPropertyType[] in server side
        public manufacturerParty: Party,
        public sellersItemIdentification: ItemIdentification,
        public originCountry: Country,
        public commodityClassification: CommodityClassification[],
        public certificate: Certificate[],
        public dimension: Dimension[],

        // for demo
        public itemConfigurationImageArray:BinaryObject[],
        public itemConfigurationImages:string,
    ) {  }
}
