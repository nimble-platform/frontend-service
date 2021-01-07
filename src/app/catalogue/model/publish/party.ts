/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Person } from "./person";
import { Contact } from "./contact";
import { Certificate } from "./certificate";
import { Address } from "./address";
import { PartyIdentification } from './party-identification';
import { PartyName } from './party-name';
import { TradingPreferences } from './trading-preferences';
import {Text} from './text';
import {Network} from './network';

export class Party {
    constructor(
        public hjid = null,
        public ppapCompatibilityLevel: number = 0,
        public contact: Contact = new Contact(),
        public postalAddress: Address = null,
        public person: Person[] = [new Person()],
        public certificate: Certificate[] = null,
        public partyIdentification: PartyIdentification[] = null,
        public partyName: PartyName[] = null,
        public salesTerms: TradingPreferences = null,
        public processID: string[] = [],
        public federationInstanceID: string = null,
        public websiteURI:string = null,
        public network: Network[] = null,
        public brandName: Text[] = null,
        public stripeAccountId:string = null
    ) { }

}
