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

import { Property } from "../../../common/model/category/property";
import { Category } from "../../../common/model/category/category";
import { Text } from './text';

export interface SelectedProperty {
    properties: Property[];
    categories: Category[];
    selected: boolean;
    lunrSearchId: string;
    key: string; // the ref for lunr

    // from Property, used for the lunr search
    preferredName: Text[],
    shortName: string;
}
