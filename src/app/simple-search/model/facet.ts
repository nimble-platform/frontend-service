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

import {FacetOption} from './facet-option';

export class Facet {
    public name: string = null;
    public genName: string = null;
    public realName: string = null; // the displayed name
    public options: FacetOption[] = []; // the list of facet options
    public showContent: boolean = false; // whether the facet content is displayed or not (if it is false, only the facet name is displayed)
    public total: number = 0; // the summation of result counts included in this facet
    public selected: boolean = false; // whether any option is selected for this facet or not
    public expanded: boolean = false; // whether all results are displayed or not
    public units: string[] = null; // the unit list for the quantity facets
    public selectedUnit: string = null; // the selected unit for the quantity facets
    public localName: string = null; // local name of the quantity properties, used to group facet options with different units
    public dataType: string = null; // the data type
    public visible: boolean = true; // whether the facet is visible or not

    constructor(json?: any) {
        if (json) {
            this.name = json.name;
            this.genName = json.genName;
            this.realName = json.realName;
            if (json.options) {
                this.options = json.options.map(item => new FacetOption(item));
            }
            this.showContent = json.showContent;
            this.total = json.total;
            this.selected = json.selected;
            this.expanded = json.expanded;
            this.units = json.units;
            this.selectedUnit = json.selectedUnit;
            this.localName = json.localName;
            this.dataType = json.dataType;
        }
    }
}
