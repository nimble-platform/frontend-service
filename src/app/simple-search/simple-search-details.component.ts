import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';
import { BPEService } from '../bpe/bpe.service';
import { OrderObject } from '../bpe/model/order-object';
import { Order } from '../bpe/model/order';
import { CookieService } from 'ng2-cookies';
import * as myGlobals from '../globals';

@Component({
	selector: 'simple-search-details',
	templateUrl: './simple-search-details.component.html'
})

export class SimpleSearchDetailsComponent implements OnInit {

	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor_name;
	product_img = myGlobals.product_img;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;
	product_configurable = myGlobals.product_configurable;
	set_configs = myGlobals.product_default;

	callback = false;
	error_detc = false;
	submitted2 = false;
	callback2 = false;
	error_detc2 = false;
	model = new Order('','','','');
	orderToSubmit = new Order('','','','');
	orderObjToSubmit = new OrderObject('','','','','','','');
	temp: any;
	response: any;
	details: any;
	configs: any;
	
	constructor(
		private simpleSearchService: SimpleSearchService,
		private bpeService: BPEService,
		private cookieService: CookieService,
		private route: ActivatedRoute
	) {
	}
	
	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.details = [];
			this.configs = [];
			this.simpleSearchService.getSingle(params['id'])
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
				this.callback = true;
				this.error_detc = false;
			})
			.catch(error => {
				this.error_detc = true;
			});
			
		});
    }
	
	order(obj: Order) {
		this.orderToSubmit = JSON.parse(JSON.stringify(obj));
		this.orderToSubmit.message = JSON.stringify(this.set_configs);
		this.orderToSubmit.product_id = this.response[0].id.toString();
		this.orderToSubmit.product_name = this.response[0][this.product_name].toString();
		this.orderObjToSubmit.order = JSON.stringify(this.orderToSubmit);
		if (this.product_vendor_id == "")
			this.orderObjToSubmit.seller = "";
		else
			this.orderObjToSubmit.seller = this.response[0][this.product_vendor_id].toString();
		if (this.product_vendor_name == "")
			this.orderObjToSubmit.sellerName = "";
		else
			this.orderObjToSubmit.sellerName = this.response[0][this.product_vendor_name].toString();
		this.orderObjToSubmit.buyer = this.cookieService.get("company_id");
		this.orderObjToSubmit.buyerName = this.cookieService.get("user_fullname");
		if (this.product_vendor_id == "")
			this.orderObjToSubmit.connection = "||"+this.cookieService.get("company_id")+"|";
		else
			this.orderObjToSubmit.connection = "|"+this.response[0][this.product_vendor_id].toString()+"|"+this.cookieService.get("company_id")+"|";
		this.bpeService.placeOrder(this.orderObjToSubmit)
		.then(res => {
			this.callback2 = true;
			this.error_detc2 = false;
		})
		.catch(error => {
			this.error_detc2 = true;
		});
	}
	
	setImage(key: string, value: string) {
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
	}
	
	checkConfig(key: string, value: string): boolean {
		var match = true;
		if (this.set_configs[key] != value)
			match = false;
		return match;
	}
	
	onSubmit() {
		this.submitted2 = true;
		this.order(this.model);
	}
	
	isJson(str: string): boolean {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}

}