import {Identifier} from "./identifier";
import {PartyName} from "./party-name";
import {Person} from "./person";
/**
 * Created by suat on 12-May-17.
 */
export class Party {
    constructor(
        public hjid: string,
        public partyName: PartyName,
        public person:Person
,    ) {  }
}
