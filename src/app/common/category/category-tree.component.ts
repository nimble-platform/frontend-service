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

import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { Category } from "../model/category/category";
import { CallStatus } from "../../common/call-status";
import { ParentCategories } from "../model/category/parent-categories";
import { sortCategories, scrollToDiv, selectPreferredName } from '../../common/utils';
import { Property } from '../model/category/property';
import {CategoryService} from '../../catalogue/category/category.service';

@Component({
    selector: 'category-tree',
    templateUrl: './category-tree.component.html',
    styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent implements OnInit {

    @Input() category: Category;
    @Input() selectedCategory: Category;

    expanded: boolean = false;
    childrenCategories: Category[];
    taxonomyId: string;
    @Input() border: boolean = true;
    @Input() selectedCategories: Category[];
    @Input() selectedPath: ParentCategories;
    @Input() level: number = 1;
    // this is the required number of steps to create category tree at the beginning
    // it is necessary to create correct category tree for FurnitureOntology categories
    @Input() numberOfSteps: number;
    private _parentCategories: ParentCategories;

    @Input() loadingStatus: boolean;

    getCategoryStatus: CallStatus = new CallStatus;

    @Output() detailsEvent: EventEmitter<Category> = new EventEmitter();

    private _scrollToDivId;

    constructor(public categoryService: CategoryService) {
    }

    ngOnInit() {
    }

    selectPreferredName(cp: Category) {
        return selectPreferredName(cp);
    }

    @Input() set parentCategories(parentCategories: ParentCategories) {
        if (this.category.taxonomyId == "eClass" || (this.category.taxonomyId == "FurnitureOntology" && this.numberOfSteps > -1)) {
            this._parentCategories = parentCategories;
            if (parentCategories && this.category.code === parentCategories.parents[this.level - 1].code && this.level < parentCategories.parents.length) {
                this.expanded = true;
                this.childrenCategories = sortCategories(parentCategories.categories[this.level])
            }
        }
    }

    @Input() set scrollToDivId(divId) {
        this._scrollToDivId = divId;
        setTimeout((() => {
            if (this.category.code === divId) {
                scrollToDiv(this.category.code);
            }
        }), 0)
    }

    get scrollToDiv() {
        return this._scrollToDivId;
    }

    get parentCategories(): ParentCategories {
        return this._parentCategories;
    }

    toggleExpanded(event: Event) {
        event.stopPropagation;
        this.expanded = !this.expanded;
        if (this.expanded && !this.childrenCategories) {
            this.getCategoryTree();
        }
    }

    getCategoryTree() {
        this.getCategoryStatus.submit();
        this.categoryService.getChildrenCategories(this.category)
            .then(categories => {
                this.childrenCategories = sortCategories(categories);
                this.getCategoryStatus.callback("Category tree created", true);
            })
            .catch(error => {
                this.getCategoryStatus.error("Error creating category tree", error);
            });
    }

    showDetails(category: Category = this.category): void {
        if (!this.loadingStatus) {
            this.detailsEvent.emit(category);
            if (!this.childrenCategories)
                this.getCategoryTree();
        }
    }

    isSelected(): boolean {
        if (this.selectedCategory != null) {
            return this.category.code === this.selectedCategory.code;
        }
        return false;
    }

    isSelectedPath(): boolean {
        let ret = false;
        /*
        if (this.isSelected())
          ret = true;
          */
        if (this.selectedPath && this.selectedPath.parents && this.selectedPath.parents.length > 0) {
            for (var i = 0; i < this.selectedPath.parents.length; i++) {
                if (this.selectedPath.parents[i].code == this.category.code)
                    ret = true;
            }
        }
        return ret;
    }

    isInSelectedCategories(): boolean {
        return this.selectedCategories.findIndex(c => c.id == this.category.id) > -1;
    }

    getToggleIcon(): string {
        if (this.level === 4) {
            return "";
        } else if (this.expanded === true) {
            return "fa-caret-down";
        } else {
            return "fa-caret-right";
        }
    }
}
