/*
 * Copyright 2020
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

import {Facet} from './facet';

export class Filter {
    constructor(
        public isCollapsed: boolean = true, // whether the filter is collapsed or not (when it is collapsed, no facets are displayed)
        public facets: Facet[] = [], // facets included in the filter
        public facetNames: string[] = [] // names of the facets included in the filter
    ) {
    }
}
