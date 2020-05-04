/**
 * Copyright 2020
 * University of Bremen, Faculty of Production Engineering, Badgasteiner Straße 1, 28359 Bremen, Germany.
 * In collaboration with BIBA - Bremer Institut für Produktion und Logistik GmbH, Bremen, Germany.
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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FactorsService } from './factors.service';
import { TreeviewConfig, TreeviewItem, TreeItem } from 'ngx-treeview';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'factors',
    templateUrl: './factors.component.html',
    styleUrls: ['./factors.component.css'],
    providers: [FactorsService]
})

export class FactorsComponent implements OnInit {
    config = TreeviewConfig.create({
        hasAllCheckBox: false,
        hasFilter: false,
        hasCollapseExpand: false,
        decoupleChildFromParent: false,
        maxHeight: 750
    });
    items: TreeviewItem[];
    value: any;
    valueName = '';
    selectedFactor: TreeItem;
    selected: number[] = [];
    totalHighlightedFactors = 0;
    totalResolvedFactors = 0;
    proceedButtonDisabled = false;
    selectedFilterDetails = [];
    collapseSelectedFilters = true;

    constructor(private service: FactorsService,
        private route: ActivatedRoute,
        private router: Router,
        private translate: TranslateService) {
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.selected = JSON.parse(params.ids);

            // Display Logic to show selected filters from Step - 1
            // as opposed to IDs
            this.selected.forEach(id => {
                const currentFiltersFromStep1: object[] = JSON.parse(sessionStorage.getItem('currentFilters'));
                currentFiltersFromStep1.forEach(filter => {
                    filter['labels'].forEach(label => {
                        if (label['id'] === id) {
                            this.selectedFilterDetails.push({ name: label['name'], parent: filter['name'] });
                        }
                    });
                });
            });
            this.service.getFactors()
                .then((items) => {
                    this.items = this.parseTree([new TreeviewItem(items)]);
                    this.countHighlightedFactors(this.items);
                });
        });
    }

    /**
     * Selected Factor information
     * @param item selected factor from the ngx-treeview
     */
    select(item: TreeItem) {
        // console.log(item);
        this.selectedFactor = item;
        this.proceedButtonDisabled = false;
    }

    /**
     * When user presses the Proceed button in the Card (right-side)
     * @param selectedFactor The selected factor from `select`
     */
    markRead(selectedFactor: TreeItem) {
        selectedFactor.checked = true;
        if (selectedFactor.value.highlighted) {
            if (this.totalResolvedFactors >= this.totalHighlightedFactors) { // If user clicks factors other than Highlighted Factors
                // show the progress to be 100%
                this.totalResolvedFactors = this.totalHighlightedFactors;
            } else {
                this.totalResolvedFactors++;
            }
        }
    }

    /**
     * RegEx check if the link string is a URL or DOI
     * @param link selected factor's array of string under `sources` key
     */
    isUrl(link: string): boolean {
        const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i');
        // console.log(pattern.test(link));
        return !!pattern.test(link);
    }

    /**
     * Recursive Function to calculate Highlighted factors based on IDs from Step-1
     * @param factors incoming information for ngx-treeview
     */
    countHighlightedFactors(factors: TreeviewItem[]) {
        factors.forEach(factor => {
            if (factor.value !== null) {
                if (factor.value.highlighted) {
                    this.totalHighlightedFactors++;
                }
            }
            if (factor.children !== undefined) {
                this.countHighlightedFactors(factor.children);
            }
        })
    }

    /**
     * Recursion Function to highlight relevant factors based on IDs from Step-1
     * @param factors Response from API. Recursive JSON
     */
    parseTree(factors: TreeviewItem[]): TreeviewItem[] {
        factors.forEach(factor => {
            if (factor.value !== null && factor.value['label_ids'] !== undefined) {
                let labels: number[] = factor.value['label_ids'];
                labels.forEach(label => {
                    if (this.selected.findIndex(l => l === label) > -1) {
                        factor.value['highlighted'] = true;
                        factor.value['class'] = 'fas fa-flag';
                    }
                });
            }
            if (factor.children !== undefined) {
                this.parseTree(factor.children);
            }
        });
        return factors;
    }

    /**
     * Navigate back to Step-1 if new filters needed
     */
    backToStep1() {
        this.router.navigate(['qualiexplore/filters']);
    }

}
