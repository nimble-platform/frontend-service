/**
 * Created by suat on 12-May-17.
 */

import {Party} from "./party";
import {CatalogueLine} from "./catalogue-line";

export class Catalogue {
    constructor(public id: string,
                public uuid: string,
                public providerParty: Party,
                public issueDate: string,
                public issueTime: string, // TODO server side handles date/time separately
                public catalogueLine: CatalogueLine[]
                ) {
    }
}
