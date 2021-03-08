/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { Unit } from "./unit";
import { KeywordSynonym } from "./keyword-synonym";
import { Value } from "./value";
import { PropertyValueQualifier } from "../../../catalogue/model/publish/property-value-qualifier";
import { Text } from '../../../catalogue/model/publish/text';

export class Property {
    constructor(
        public id: string,
        public preferredName: Text[] = [],
        public shortName: string,
        public definition: string,
        public note: string,
        public remark: Text[] = [],
        public preferredSymbol: string,
        public unit: Unit,
        public iecCategory: string,
        public attributeType: string,
        public dataType: PropertyValueQualifier,
        public synonyms: KeywordSynonym[],
        public values: Value[],
        public uri: string,
        public required:boolean
    ) { }
}
