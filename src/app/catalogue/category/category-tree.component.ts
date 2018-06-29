import {Component, OnInit, Input, EventEmitter, Output} from "@angular/core";
import { Category } from "../model/category/category";
import {CategoryService} from "./category.service";
import { CallStatus } from "../../common/call-status";
import { ParentCategories } from "../model/category/parent-categories";
import { sortCategories } from "../../common/utils";

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
    @Input() level: number = 1;
    private _parentCategories: ParentCategories;

    getCategoryStatus: CallStatus = new CallStatus;

    @Output() detailsEvent: EventEmitter<Category> = new EventEmitter();
    @Output() categoryEvent: EventEmitter<Category> = new EventEmitter();

    constructor(public categoryService: CategoryService) {
    }

    ngOnInit() {
    }

    @Input() set parentCategories(parentCategories: ParentCategories) {
        console.log(parentCategories, this.level, this.category);
        this._parentCategories = parentCategories;
        if(parentCategories && this.category.code === parentCategories.parents[this.level - 1].code && this.level < parentCategories.parents.length) {
            this.expanded = true;
            this.childrenCategories = sortCategories(parentCategories.categories[this.level])
        }
    }

    get parentCategories(): ParentCategories {
        return this._parentCategories;
    }

    toggleExpanded(event: Event) {
        event.stopPropagation;
        this.expanded = !this.expanded;
        if(this.expanded && !this.childrenCategories) {
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
                this.getCategoryStatus.error("Error creating category tree");
            });
    }

    showDetails(category: Category = this.category): void {
        this.detailsEvent.emit(category);
    }

    selectCategory(category: Category = this.category): void {
        this.categoryEvent.emit(category);
    }

    isSelected(): boolean {
        return this.category === this.selectedCategory;
    }

    getToggleIcon(): string {
        if(this.level === 4){
            return "";
        } else if(this.expanded === true) {
            return "fa-caret-down";
        } else {
            return "fa-caret-right";
        }
    }
}
