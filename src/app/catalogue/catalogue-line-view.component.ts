import {Component, Input} from "@angular/core";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {CatalogueService} from "./catalogue.service";
import {Router} from "@angular/router";

@Component({
    selector: 'catalogue-line-view',
    templateUrl: './catalogue-line-view.component.html'
})

// Component that displays information for individual catalogue lines in the Catalogue page

export class CatalogueLineViewComponent {

    selectedTab: string = "Product Details";
    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;

    constructor(private catalogueService: CatalogueService,
                private router: Router) {}

    redirectToEdit() {
        this.catalogueService.editCatalogueLine(this.catalogueLine);
        this.router.navigate(['publish'], {queryParams: {newPublishing: true, edit: true}});
    }

    deleteCatalogueLine():void {
        this.catalogueService.deleteCatalogueLine(this.catalogueService.catalogue.uuid, this.catalogueLine.id);
    }
}
