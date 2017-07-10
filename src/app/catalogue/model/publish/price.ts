/**
 * Created by suat on 12-May-17.
 */

import {Party} from "./party";
import {Identifier} from "./identifier";
import {CatalogueLine} from "./catalogue-line";

export class Catalogue {
    constructor(public id: Identifier,
                public uuid: Identifier,
                public providerParty: Party,
                public catalogueLine: CatalogueLine[]) {
    }
}
