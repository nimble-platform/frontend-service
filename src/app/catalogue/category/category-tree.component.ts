import {Component, OnInit, Input} from "@angular/core";
import { Category } from "../model/category/category";

@Component({
    selector: 'category-tree',
    templateUrl: './category-tree.component.html',
    styleUrls: ['./category-tree.component.css']
})
export class CategoryTreeComponent implements OnInit {

    @Input() categories: Category[];

    expandedCategories: boolean[];

    constructor() {

    }

    ngOnInit() {
        this.expandedCategories = this.categories.map(() => false);
    }
}
