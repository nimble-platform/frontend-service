import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {SimpleSearchService} from "./simple-search.service";
import {BPEService} from "../bpe/bpe.service";
import {CookieService} from "ng2-cookies";
import * as myGlobals from "../globals";
import {ProcessInstanceInputMessage} from "../bpe/model/process-instance-input-message";
import {ProcessVariables} from "../bpe/model/process-variables";
import {ModelUtils} from "../bpe/model/model-utils";
import {UserService} from "../user-mgmt/user.service";
import {UBLModelUtils} from "../catalogue/model/ubl-model-utils";
import {CustomerParty} from "../catalogue/model/publish/customer-party";
import {SupplierParty} from "../catalogue/model/publish/supplier-party";
import {LineReference} from "../catalogue/model/publish/line-reference";
import {CatalogueService} from "../catalogue/catalogue.service";
import {CatalogueLine} from "../catalogue/model/publish/catalogue-line";
import {CallStatus} from "../common/call-status";
import {BPDataService} from "../bpe/bp-view/bp-data-service";

@Component({
	selector: 'simple-search-details',
	templateUrl: './simple-search-details.component.html',
	styleUrls: ['./simple-search-details.component.css']
})

export class SimpleSearchDetailsComponent implements OnInit {
	bpOptionsActive:boolean = false;
	singleMode:boolean = false;
	getCatalogueLineStatus:CallStatus = new CallStatus();
	public roles = [];
	public debug = myGlobals.debug;

	constructor(
		public catalogueService: CatalogueService,
		public bpDataService: BPDataService,
		public route: ActivatedRoute,
		public cookieService: CookieService,
		private cdr: ChangeDetectorRef
	) {
	}

	ngOnInit(): void {
		this.route.queryParams.subscribe(params => {
			let id = params['id'];
			let catalogueId = params['catalogueId'];
			this.getCatalogueLineStatus.submit();
			this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
				this.bpDataService.resetBpData();
				this.bpDataService.catalogueLine = line;
				this.bpDataService.userRole = 'buyer';
				this.bpOptionsActive = params['showOptions'] == 'true';
				this.getCatalogueLineStatus.callback("Retrieved product details", true);
			}).catch(error => {
				this.getCatalogueLineStatus.error("Failed to retrieve product details");
			});
		});
		if (this.cookieService.get('bearer_token')) {
			const at = this.cookieService.get('bearer_token');
			if (at.split(".").length == 3) {
				const at_payload = at.split(".")[1];
				try {
					const at_payload_json = JSON.parse(atob(at_payload));
					const at_payload_json_roles = at_payload_json["realm_access"]["roles"];
					this.roles = at_payload_json_roles;
				}
				catch(e){}
			}
		}
		else
			this.roles = [];
    }
}
