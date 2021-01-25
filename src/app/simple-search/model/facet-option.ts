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

export class FacetOption {
    public name: string = null; // the name of facet option i.e., the value which is indexed on solr
    public realName: string = null; // the displayed name
    public count: number = 0; // the result count
    public languageId: string = null; // the language id of the facet option, used for the brand name facet options
    public selected: boolean = false; // whether the facet option is selected
    public unit: string = null // unit for the quantity facet options
    public unitGenName: string = null; // the name of solr index field for facet option, used for the quantity facet options since each unit has a different index field name on solr

    constructor(json?: any) {
        if (json) {
            this.name = json.name;
            this.realName = json.realName;
            this.count = json.count;
            this.languageId = json.languageId;
            this.selected = json.selected;
            this.unitGenName = json.unitGenName;
            this.unit = json.unit;
        }
    }
}
