import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {SimpleSearchService} from "./simple-search.service";
import {BPEService} from "../bpe/bpe.service";
import {Order} from "../bpe/model/ubl/order";
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

@Component({
	selector: 'simple-search-details',
	templateUrl: './simple-search-details.component.html',
	styleUrls: ['./simple-search-details.component.css']
})

export class SimpleSearchDetailsComponent implements OnInit {

	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor_name;
	set_configs = myGlobals.product_default;

	catalogueLine: CatalogueLine;
	selectedOption:string = "order";
	bpOptionsActive:boolean = false;


	callback = false;
	error_detc = false;
	getCatalogueLineStatus:CallStatus = new CallStatus();
	details: any;
	configs: any;

	constructor(
		private simpleSearchService: SimpleSearchService,
		private bpeService: BPEService,
		private catalogueService: CatalogueService,
		private userService: UserService,
		private cookieService: CookieService,
		private route: ActivatedRoute
	) {
	}
	
	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.details = [];
			this.configs = [];

			let id = params['id'];
			let catalogueId = params['catalogueId'];
			this.getCatalogueLineStatus.submit();
			this.catalogueService.getCatalogueLine(catalogueId, id).then(line => {
				this.catalogueLine = line;
				this.getCatalogueLineStatus.callback("Retrieved product details", true);
			}).catch(error => {
				this.getCatalogueLineStatus.error("Failed to retrieve product details");
			});

			/*this.simpleSearchService.getSingle(id)
			.then(res => {
				this.temp = res.response.docs;
				for (let doc in this.temp) {
					if (this.isJson(this.temp[doc][this.product_img])) {
						this.temp[doc]['img_array'] = JSON.parse(this.temp[doc][this.product_img]);
						var json = JSON.parse(this.temp[doc][this.product_img]);
						var img = "";
						if (json.length > 1)
							img = "data:"+JSON.parse(this.temp[doc][this.product_img][0])[0].mimeCode+";base64,"+JSON.parse(this.temp[doc][this.product_img][0])[0].value;
						else
							img = "data:"+this.temp[doc][this.product_img].mimeCode+";base64,"+this.temp[doc][this.product_img].value;
						this.temp[doc][this.product_img] = img;
					}
				}
				this.response = JSON.parse(JSON.stringify(this.temp));
				for (let entry in res.response.docs[0]) {
					if (this.simpleSearchService.checkField(entry)) {
						this.details.push({
							"key":entry,
							"value":res.response.docs[0][entry]
						});
					}
				}
				this.details.sort(function(a: any, b: any){
					var a_comp = a.key;
					var b_comp = b.key;
					return a_comp.localeCompare(b_comp);
				});
				for (let entry in res.response.docs[0]) {
					if (this.product_configurable.indexOf(entry) != -1) {
						this.configs.push({
							"key":entry,
							"value":JSON.parse(res.response.docs[0][entry])
						});
					}
				}
				this.configs.sort(function(a: any, b: any){
					var a_comp = a.key;
					var b_comp = b.key;
					return a_comp.localeCompare(b_comp);
				});

				this.catalogueService.getCatalogueLine(this.response[0]["item_catalogue_id"][0], this.response[0]["item_id"][0]).then(
					line => this.catalogueLine = line
				);

				this.callback = true;
				this.error_detc = false;
			})
			.catch(error => {
				this.error_detc = true;
			});*/


			
		});
    }
	
	/*setImage(key: string, value: string) {
		this.set_configs[key] = value;
		var overall_match = false;
		for (let doc in this.temp) {
			for (let inner in this.temp[doc]['img_array']) {
				var metadata = this.temp[doc]['img_array'][inner].objectMetadata;
				var metadata_json = {};
				metadata = metadata.split("{")[1].split("}")[0];
				metadata = metadata.split(", ");
				for (let m of metadata) {
					metadata_json[m.split(": ")[0]] = m.split(": ")[1];
				}
				var match = true;
				for (let k in metadata_json) {
					if (this.set_configs[k] != metadata_json[k])
						match = false;
				}
				if (match) {
					overall_match = true;
					this.temp[doc][this.product_img] = "data:"+this.temp[doc]['img_array'][inner].mimeCode+";base64,"+this.temp[doc]['img_array'][inner].value;
					this.response = JSON.parse(JSON.stringify(this.temp));
				}
			}
			if (!overall_match) {
				this.temp[doc][this.product_img] = "assets/empty_img.png";
				this.response = JSON.parse(JSON.stringify(this.temp));
			}
		}
	}*/
}