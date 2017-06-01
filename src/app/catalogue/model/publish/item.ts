/**
 * Created by suat on 12-May-17.
 */

import {AdditionalItemProperty} from "./additional-item-property";
import {Party} from "./party";
import {BinaryObject} from "./binary-object";

export class Item {
    constructor(
        public name: string,
        public description: string,
        public additionalItemProperty: AdditionalItemProperty[],
        public manufacturerParty: Party,

        // for demo
        public itemConfigurationImageArray:BinaryObject[],
        public itemConfigurationImages:string
    ) {  }
}
