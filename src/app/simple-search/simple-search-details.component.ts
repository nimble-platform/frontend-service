import {Component, OnInit} from "@angular/core";
import {AppComponent} from "../app.component";
import {ActivatedRoute} from "@angular/router";
import {CookieService} from "ng2-cookies";
import * as myGlobals from "../globals";
import {CatalogueService} from "../catalogue/catalogue.service";
import {CallStatus} from "../common/call-status";
import {BPDataService} from "../bpe/bp-view/bp-data-service";
import {PrecedingBPDataService} from '../bpe/bp-view/preceding-bp-data-service';

@Component({
	selector: 'simple-search-details',
	templateUrl: './simple-search-details.component.html',
	styleUrls: ['./simple-search-details.component.css']
})

export class SimpleSearchDetailsComponent implements OnInit {
	bpOptionsActive:boolean = false;
	singleMode:boolean = false;
	getCatalogueLineStatus:CallStatus = new CallStatus();
	// process group instance id related to the business process to be initiated
	gid: string;
	public debug = myGlobals.debug;

	constructor(
		public catalogueService: CatalogueService,
		public bpDataService: BPDataService,
		public route: ActivatedRoute,
		public cookieService: CookieService,
		public appComponent: AppComponent,
		public precedingBPDataService: PrecedingBPDataService
	) {
	}

	ngOnInit(): void {
        this.bpDataService.setCatalogueLines([]);
        this.getCatalogueLineStatus.submit();
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
			let catalogueId = params['catalogueId'];

            //this.bpDataService.catalogueLine = null;
			this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
				this.precedingBPDataService.reset();
				this.bpDataService.resetBpData();
				this.bpDataService.setCatalogueLines([line]);
				this.bpDataService.userRole = 'buyer';
				this.bpDataService.setRelatedGroupId(null);
				this.bpOptionsActive = params['showOptions'] == 'true';
				this.getCatalogueLineStatus.callback("Retrieved product details", true);
			}).catch(error => {
				this.getCatalogueLineStatus.error("Failed to retrieve product details");
			});
		});
    }
}
