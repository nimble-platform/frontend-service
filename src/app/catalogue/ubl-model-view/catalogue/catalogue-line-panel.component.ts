import {Component, Input} from "@angular/core";
import {CatalogueLine} from "../../model/publish/catalogue-line";
import {CatalogueService} from "../../catalogue.service";
import {Router} from "@angular/router";
import {PublishService} from "../../publish-and-aip.service";

@Component({
    selector: 'catalogue-line-panel',
    templateUrl: './catalogue-line-panel.component.html'
})

export class CatalogueLinePanelComponent {

    @Input() catalogueLine: CatalogueLine;
    @Input() presentationMode: string;

    constructor(private catalogueService: CatalogueService,
                private publishService: PublishService,
                private router: Router) {
    }

    redirectToEdit() {
        this.catalogueService.editCatalogueLine(this.catalogueLine);
        this.publishService.publishMode = 'edit';
        this.publishService.publishingStarted = false;
        this.router.navigate(['catalogue/publish']);
    }

    deleteCatalogueLine(): void {
		if (confirm("Are you sure that you want to delete this catalogue item?")) {
			this.catalogueService.deleteCatalogueLine(this.catalogueService.catalogue.uuid, this.catalogueLine.id);
		}
    }
}
