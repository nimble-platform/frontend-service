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

import {Country} from './country';
import {DocumentReference} from './document-reference';
import {Metadata} from './metadata';
import {Text} from './text';
import {Code} from './code';
import {BinaryObject} from './binary-object';

export class Demand {
    public hjid: number;
    public metadata: Metadata;
    public title: Text[];
    public description: Text[];
    public itemClassificationCode: Code[];
    public dueDate: string;
    public buyerCountry: Code;
    public deliveryCountry: Code;
    public additionalDocumentReference: DocumentReference;
    public image: BinaryObject;
    constructor(json?: any) {
        if (json) {
            this.hjid = json.hjid;
            this.metadata = new Metadata(json.metadata);
            this.title = json.title;
            this.description = json.description;
            this.itemClassificationCode = json.itemClassificationCode;
            this.dueDate = json.dueDate;
            this.buyerCountry = json.buyerCountry;
            this.deliveryCountry = json.deliveryCountry;
            this.additionalDocumentReference = json.additionalDocumentReference;
            this.image = json.image;
        }
    }
}
