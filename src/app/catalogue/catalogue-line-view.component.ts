import {Component, Input} from "@angular/core";
import { CatalogueLine } from "./model/publish/catalogue-line";
import {CatalogueService} from "./catalogue.service";
import {Router} from "@angular/router";
import {CategoryService} from "./category/category.service";

@Component({
    selector: 'catalogue-line-view',
    templateUrl: './catalogue-line-view.component.html'
})

export class CatalogueLineViewComponent {

    selectedTab: string = "Product Details";
    @Input() catalogueLine: CatalogueLine;

    constructor(private catalogueService: CatalogueService,
                private categoryService: CategoryService,
                private router: Router) {}

    redirectToEdit() {
        this.categoryService.resetData();
        this.catalogueService.editCatalogueLine(this.catalogueLine);
        this.router.navigate(['publish'], {queryParams: {fromScratch: false, edit: true}});
    }
}
