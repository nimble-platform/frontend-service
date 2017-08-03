import { Component, OnInit } from "@angular/core";
import { CookieService } from 'ng2-cookies';
import { CatalogueService } from "./catalogue.service";
import { CatalogueLine } from "./model/publish/catalogue-line";
import {Catalogue} from "./model/publish/catalogue";


@Component({
    selector: 'catalogue-view',
    templateUrl: './catalogue-view.component.html',
    providers: [ CookieService ]
})

// Container component for CatalogueLineView's

export class CatalogueViewComponent implements OnInit {

    constructor(
        private cookieService: CookieService,
        private catalogueService: CatalogueService
    ) {	}

    catalogue: Catalogue;

    ngOnInit() {
        this.requestCatalogue();
    }

    public requestCatalogue(): void {
        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogue(userId).then(catalogue => {
                this.catalogue = catalogue;
            }
        );
    }
}
