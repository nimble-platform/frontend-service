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

import {CatalogueLine} from './catalogue-line';

export class CataloguePaginationResponse {
    constructor(
        public catalogueUuid:string = null, // uuid of the catalogue
        public size: number = null, // the number of catalogue lines which the catalogue contains
        public catalogueLines: CatalogueLine[] = null, // catalogue lines of the catalogue
        public categoryNames: String[] = [], // names of the categories which are included in catalogue lines of the catalogue
        public catalogueId:string = null, // identifier of the catalogue
    ) {  }
}
