/**
 * Created by suat on 12-May-17.
 */

import {AdditionalItemProperty} from "./additional-item-property";
import {Party} from "./party";

export class Item {
    constructor(
        public name: string,
        public additionalItemProperties: AdditionalItemProperty[],
        public manufacturerParty: Party
    ) {  }
}
