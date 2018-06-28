import {Component, OnInit, Input, EventEmitter, Output} from "@angular/core";
import { Category } from "../model/category/category";
import {CategoryService} from "./category.service";
import { CallStatus } from "../../common/call-status";

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

    getCategoryStatus: CallStatus = new CallStatus;

    @Output() detailsEvent: EventEmitter<Category> = new EventEmitter();
    @Output() categoryEvent: EventEmitter<Category> = new EventEmitter();

    constructor(public categoryService: CategoryService) {
    }

    ngOnInit() {
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
                this.childrenCategories = categories.sort((a,b) => (a.preferredName < b.preferredName) ? -1 : (a.preferredName > b.preferredName) ? 1 : 0);
                this.getCategoryStatus.callback("...", true);
            })
            .catch(error => {
                this.getCategoryStatus.error("...");
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
