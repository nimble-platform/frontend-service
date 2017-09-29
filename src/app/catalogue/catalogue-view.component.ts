import {Component, OnInit} from "@angular/core";
import {CookieService} from 'ng2-cookies';
import {CatalogueService} from "./catalogue.service";
import {CatalogueLine} from "./model/publish/catalogue-line";
import {Catalogue} from "./model/publish/catalogue";
import {CallStatus} from "../common/call-status";
import {ActivatedRoute, Params} from "@angular/router";


@Component({
    selector: 'catalogue-view',
    templateUrl: './catalogue-view.component.html',
    providers: [CookieService]
})

export class CatalogueViewComponent implements OnInit {

    private getCatalogueStatus = new CallStatus();
    private deleteCatalogueStatus = new CallStatus();

    constructor(private cookieService: CookieService,
                private catalogueService: CatalogueService,
                private route: ActivatedRoute) {
    }

    catalogue: Catalogue;

    ngOnInit() {
        this.catalogueService.setEditMode(false);

        let forceUpdate:boolean = false;
        this.route.queryParams.subscribe((params: Params) => {
            forceUpdate = params['forceUpdate'] == "true";
            this.requestCatalogue(forceUpdate);
        });
    }

    public requestCatalogue(forceUpdate:boolean): void {
        this.getCatalogueStatus.submit();

        let userId = this.cookieService.get("user_id");
        this.catalogueService.getCatalogueForceUpdate(userId, forceUpdate).then(catalogue => {
                this.catalogue = catalogue;
                this.getCatalogueStatus.callback(null);
            },
            error => {
                this.getCatalogueStatus.error("Failed to get catalogue");
            }
        );
    }

    public onDeleteCatalogue(): void {
        this.deleteCatalogueStatus.submit();

        this.catalogueService.deleteCatalogue().then(res => {
                this.catalogueService.catalogue = null;
                this.deleteCatalogueStatus.reset();
                this.requestCatalogue(false);
                /*this.fb_get_catalogue_callback = true;
                 this.fb_get_catalogue_submitted = false;*/
            },
            error => {
                this.deleteCatalogueStatus.error("Failed to delete catalogue");
            }
        );
    }
}
