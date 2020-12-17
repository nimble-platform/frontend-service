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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Facet} from '../model/facet';

@Component({
    selector: 'search-facet',
    templateUrl: './search-facet.component.html',
})
export class SearchFacetComponent implements OnInit {
    @Input() collapsable = false;
    @Input() facet: Facet;
    @Output() facetOptionSelected: EventEmitter<any> = new EventEmitter<any>();

    showContent = true;
    expanded = false;
    selected = false;

    maxFacets = 10;

    ngOnInit(): void {
    }

    onOptionSelected(selectedValue: any): void {
        const selectionContext: any = {
            selectedValue: selectedValue,
            facet: this.facet.facetName
        };
        this.facetOptionSelected.emit(selectionContext);
    }

    onFacetTitleClicked(facet: any) {
        if (this.collapsable) {
            this.showContent = !this.showContent;
        }
    }
}
