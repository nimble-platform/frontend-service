import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';
import { BPEService } from '../bpe/bpe.service';
import { Order } from '../bpe/model/order';
import { CookieService } from 'ng2-cookies';
import * as myGlobals from '../globals';

@Component({
	selector: 'simple-search-details',
	templateUrl: './simple-search-details.component.html'
})

export class SimpleSearchDetailsComponent implements OnInit {

	product_name = myGlobals.product_name;
	product_vendor = myGlobals.product_vendor;
	product_img = myGlobals.product_img;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;

	callback = false;
	error_detc = false;
	submitted2 = false;
	callback2 = false;
	error_detc2 = false;
	model = new Order('','','',{amount:'',message:'',product_id:'',product_name:''});
	objToSubmit = new Order('','','',{amount:'',message:'',product_id:'',product_name:''});
	response: any;
	details: any;
	
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
			this.simpleSearchService.getSingle(params['id'])
			.then(res => {
				this.response = res.response.docs;
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
				this.callback = true;
				this.error_detc = false;
			})
			.catch(error => {
				this.error_detc = true;
			});
			
		});
    }
	
	order(obj: Order) {
		this.objToSubmit = JSON.parse(JSON.stringify(obj));
		this.objToSubmit.order.product_id = this.response[0].id.toString();
		this.objToSubmit.order.product_name = this.response[0][this.product_name].toString();
		this.objToSubmit.seller = this.response[0][this.product_vendor].toString();
		this.objToSubmit.buyer = this.cookieService.get("company_id");
		this.objToSubmit.connection = "|"+this.response[0][this.product_vendor].toString()+"|"+this.cookieService.get("company_id")+"|";
		this.bpeService.placeOrder(this.objToSubmit)
		.then(res => {
			this.callback2 = true;
			this.error_detc2 = false;
		})
		.catch(error => {
			this.error_detc2 = true;
		});
	}
	
	onSubmit() {
		this.submitted2 = true;
		this.order(this.model);
	}

}