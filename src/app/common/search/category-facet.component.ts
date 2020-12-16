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
import * as myGlobals from '../../globals';
import {selectNameFromLabelObject} from '../utils';
import {CategoryService} from '../../catalogue/category/category.service';

@Component({
    selector: 'category-facet',
    templateUrl: './category-facet.component.html',
    styleUrls: ['./category-facet.component.css'],
})
export class CategoryFacetComponent implements OnInit {

    /**
     * Includes category uris to be presented along with the counts
     * [
     *  {
     *    'categoryUri': 'uri1',
     *    'count': 3
     *  },
     *  ...
     * ]
     */
    @Input() categoryCounts: any[];
    @Output() categorySelected: EventEmitter<string> = new EventEmitter<string>();

    cat_level;
    cat_levels;
    // // category counts which are needed to build category tree
    // categoryCounts: any[] = null;

    cat: string;
    catId: string;
    taxonomy: string;
    taxonomyIDs: string[];

    loading = false;

    constructor(private categoryService: CategoryService) {
    }

    ngOnInit() {
        this.taxonomyIDs = Object.keys(myGlobals.config.categoryFilter);
        // if the standard taxonomy is 'All', then we use 'eClass' as the default taxonomy
        // and populate 'taxonomyIDs' variable with the ones available in the instance
        if (myGlobals.config.standardTaxonomy.localeCompare('All') === 0) {
            this.taxonomy = 'eClass';
            this.taxonomyIDs = Object.keys(myGlobals.config.categoryFilter);
        } else {
            this.taxonomy = myGlobals.config.standardTaxonomy;
        }
        this.buildCatTree();
    }

    public changeTaxonomyId(taxonomyId) {
        if (this.taxonomy !== taxonomyId) {
            this.taxonomy = taxonomyId;
            this.buildCatTree();
        }
    }

    public onSelectCategory(name: string, id: string, level: number) {
        this.categorySelected.emit(id);
        console.log('SELECT CAT', name, id, level);
    }

    private async buildCatTree() {

        // taxonomy prefix corresponds to the base url of the taxonomy that exists before each relevant category
        // e.g. assuming category url: http://www.aidimme.es/FurnitureSectorOntology.owl#MDFBoard
        // taxonomy prefix would be: http://www.aidimme.es/FurnitureSectorOntology.owl#
        let taxonomyPrefix = '';
        if (myGlobals.config.categoryFilter[this.taxonomy] && myGlobals.config.categoryFilter[this.taxonomy].ontologyPrefix) {
            taxonomyPrefix = myGlobals.config.categoryFilter[this.taxonomy].ontologyPrefix;
        }

        this.loading = true;
        // here, all the information about the categories are fetched from the indexing service
        const indexCategories = await this.categoryService.getCategories(this.categoryCounts.map(cat => cat.categoryUri));
        // extract only the required information in UI from the complete category information
        let categoryDisplayInfo: any = this.getCategoryDisplayInfo(indexCategories, this.categoryCounts);
        if (taxonomyPrefix !== '') {
            // save the selected category
            let originalSelectedCategoryID = this.catId;
            let originalSelectedCategoryName = this.cat;
            // build the category tree until the latest level contains more than one category or
            // the category at the latest level does not have any children categories
            let previouslySelectedCategoryId = '';
            do {
                previouslySelectedCategoryId = this.catId;
                // set the level of the selected category, if any
                this.cat_level = this.getCatLevel(this.catId, indexCategories.result);
                this.cat_levels = [];
                this.constructCategoryTree(indexCategories.result, categoryDisplayInfo, this.taxonomy, taxonomyPrefix);

                this.sortCatLevels();
                // if the latest level contains only one category, make it the selected category
                // and populate category tree again
                let catLevelSize = this.cat_levels.length;
                if (catLevelSize > 0 && this.cat_levels[catLevelSize - 1].length === 1) {
                    this.catId = this.cat_levels[catLevelSize - 1][0].id;
                    this.cat = this.cat_levels[catLevelSize - 1][0].name;
                }

            } while (this.catId !== previouslySelectedCategoryId);
            // set the selected category
            this.catId = originalSelectedCategoryID;
            this.cat = originalSelectedCategoryName;
        } else {
            // set the level of the selected category, if any
            this.cat_level = this.getCatLevel(this.catId, indexCategories.result);
            this.cat_levels = [];
        }
        this.loading = false;
    }

    private constructCategoryTree(indexCategories: any[],
                                  categoryDisplayInfo: any,
                                  taxonomy: string,
                                  taxonomyPrefix: string) {
        if (this.cat_level === -1) {
            // get root categories
            let rootCategories: any[] = [];
            for (let category of indexCategories) {
                if (category.allParents == null && this.isCategoryDisplayable(category.uri, categoryDisplayInfo, taxonomy, taxonomyPrefix)) {
                    rootCategories.push({
                        'name': category.uri,
                        'id': category.uri,
                        'count': categoryDisplayInfo[category.uri].count,
                        'preferredName': selectNameFromLabelObject(categoryDisplayInfo[category.uri].label)
                    });
                }
            }
            this.cat_levels.push(rootCategories);

        } else {
            let selectedIndexCategory: any = indexCategories.find(indexCategory => indexCategory.uri === this.catId);
            for (let indexCategory of indexCategories) {
                // check whether the category belongs to the active taxonomy and not hidden
                if (!this.isCategoryDisplayable(indexCategory.uri, categoryDisplayInfo, taxonomy, taxonomyPrefix)) {
                    continue;
                }

                let parentsAndChildren: string[] =
                    (selectedIndexCategory.allChildren != null ? selectedIndexCategory.allChildren : [])
                        .concat(selectedIndexCategory.allParents != null ? selectedIndexCategory.allParents : []);
                let catLevel = indexCategory.allParents != null ? indexCategory.allParents.length : 0;
                if (indexCategory.uri !== selectedIndexCategory.uri && // include the taxonomy itself no matter what
                    // do not include the category if it is not include in the hierarchy of the selected category
                    // or it is located on a two or more levels deeper in the hierarchy
                    parentsAndChildren.findIndex(uri => uri === indexCategory.uri) === -1 || (catLevel - this.cat_level > 1)) {
                    continue;
                }

                if (this.cat_levels[catLevel] == null) {
                    this.cat_levels[catLevel] = [];
                }

                let categoryUri: string = indexCategory.uri;
                this.cat_levels[catLevel].push({
                    'name': categoryUri,
                    'id': categoryUri,
                    'count': categoryDisplayInfo[categoryUri].count,
                    'preferredName': selectNameFromLabelObject(categoryDisplayInfo[categoryUri].label)
                });
            }
        }
    }

    private getCategoryDisplayInfo(indexCategories: any, categoryCounts: any): any {
        let labelMap = {};
        for (let category of indexCategories.result) {
            labelMap[category.uri] = {};
            labelMap[category.uri].label = category.label;
            labelMap[category.uri].code = category.code;
            labelMap[category.uri].isRoot = category.allParents == null;
            let searchCategory: any = categoryCounts.find(categoryCount => category.uri === categoryCount.categoryUri);
            if (searchCategory) {
                labelMap[category.uri].count = searchCategory.count;
            }
        }
        return labelMap;
    }

    /**
     * Decides whether a category could be displayed in the category taxonomy filter. Checks:
     * 1) whether the resultant category has appropriate labels
     * 2) whether the category belongs to the active taxonomy
     * 3) is not configured as hidden
     */
    private isCategoryDisplayable(categoryUri: string, categoryDisplayInfo: any, taxonomy: string, taxonomyPrefix: string): boolean {
        let idSplitIndex = categoryUri.lastIndexOf('#');
        let categoryName = categoryUri.substr(idSplitIndex + 1);
        return categoryDisplayInfo[categoryUri] != null &&
            categoryUri.indexOf(taxonomyPrefix) !== -1 &&
            myGlobals.config.categoryFilter[taxonomy].hiddenCategories.indexOf(categoryName) === -1;
    }

    private getCatLevel(categoryUri: string, indexCategories: any): number {
        if (categoryUri) {
            let category: any = indexCategories.find(indexCategory => indexCategory.uri === categoryUri);
            return category.allParents != null ? category.allParents.length : 0;
        } else {
            return -1;
        }
    }

    private sortCatLevels() {
        for (let i = 0; i < this.cat_levels.length; i++) {
            this.cat_levels[i].sort(function (a, b) {
                const a_c: string = a.preferredName;
                const b_c: string = b.preferredName;
                return a_c.localeCompare(b_c);
            });
        }
    }
}
