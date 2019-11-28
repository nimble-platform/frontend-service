/**
 * Created by suat on 12-May-17.
 */

import {Party} from "./party";
import {CatalogueLine} from "./catalogue-line";

export class Catalogue {
    constructor(public id: string = null,
                public uuid: string = null,
                public providerParty: Party = null,
                public issueDate: string = null,
                public issueTime: string = null, // TODO server side handles date/time separately
                public catalogueLine: CatalogueLine[] = null
                ) {
    }
}
