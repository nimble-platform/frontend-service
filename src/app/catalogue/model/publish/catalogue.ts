/**
 * Created by suat on 12-May-17.
 */

import {Party} from "./party";
import {CatalogueLine} from "./catalogue-line";

export class Catalogue {
    constructor(public id: string,
                public uuid: string,
                public providerParty: Party,
                public issueDate: string, // TODO not sure about string for date/time
                public issueTime: string, // TODO not sure about string for date/time
                public catalogueLine: CatalogueLine[]
                ) {
    }
}
