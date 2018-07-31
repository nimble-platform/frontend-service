import {Component, Input, Output,EventEmitter} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {CatalogueService} from "../../catalogue.service";
import {Router} from "@angular/router";
import {PublishService} from "../../publish-and-aip.service";
import {CategoryService} from "../../category/category.service";
import { ProductWrapper } from "../../../common/product-wrapper";
import {Item} from '../../model/publish/item';

@Component({
    selector: 'catalogue-line-panel',
    templateUrl: './catalogue-line-panel.component.html'
})

export class CatalogueLinePanelComponent {

    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;

    // check whether catalogue-line-panel should be displayed
    @Input() show = false;
    @Output() showChange = new EventEmitter<boolean>();

    productWrapper: ProductWrapper;

    public defaultLanguage : string = "en";

    constructor(private catalogueService: CatalogueService,
                private categoryService: CategoryService,
                private publishService: PublishService,
                private router: Router) {
    }

    ngOnInit() {
        this.productWrapper = new ProductWrapper(this.catalogueLine);
    }

    public selectDescription(item: Item) {
        for (let pName of item.description) {
            if(pName.languageID === this.defaultLanguage) {
                return pName.value;
            }
        }

        return item.description[0].value;
    }

    redirectToEdit() {
        this.catalogueService.editCatalogueLine(this.catalogueLine);
        this.publishService.publishMode = 'edit';
        this.publishService.publishingStarted = false;
        this.categoryService.resetSelectedCategories();
        this.router.navigate(['catalogue/publish'], {queryParams: {pg: "single"}});
    }

    deleteCatalogueLine(): void {
		if (confirm("Are you sure that you want to delete this catalogue item?")) {
			this.catalogueService.deleteCatalogueLine(this.catalogueService.catalogue.uuid, this.catalogueLine.id);
		}
    }
}
