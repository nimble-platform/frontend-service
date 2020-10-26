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

import { BinaryObject } from "./binary-object";
import { Code } from "./code";
import { Quantity } from "./quantity";
import { PropertyValueQualifier } from "./property-value-qualifier";
import { Text } from "./text";

export class ItemProperty {
    constructor(
        public id: string,
        public name: Text[] = [],
        // value bir dil icin birden fazla deger olabilir. Yani su sekilde olacak (ornegin name = [ color , renk ]):
        // value = [ tr:kirmizi, tr:mavi, en:red, en: blue ]
        public value: Text[] = [],
        public valueDecimal: number[],
        public valueQuantity: Quantity[],
        public valueBinary: BinaryObject[],
        public valueQualifier: PropertyValueQualifier,
        public itemClassificationCode: Code,
        public uri: string,
        public associatedCatalogueLineID: number[], // hjids of catalogue lines
        public required:boolean = false, // whether this property is required or not (does not exist in the backend data model and used only in the UI)
        public options:Text[] = [] // available options to be selected as a value for the item property (does not exist in the backend data model and used only in the UI)
    ) { }
}
