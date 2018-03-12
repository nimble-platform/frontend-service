import { Component, OnInit } from '@angular/core';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';
import { Router, ActivatedRoute} from "@angular/router";
import * as myGlobals from '../globals';
import {SearchContextService} from "./search-context.service";

@Component({
	selector: 'simple-search-form',
	templateUrl: './simple-search-form.component.html',
	styleUrls: ['./simple-search-form.component.css']
})

export class SimpleSearchFormComponent implements OnInit {

	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor_name;
	product_img = myGlobals.product_img;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;

	submitted = false;
	callback = false;
	error_detc = false;
	size = 0;
	page = 1;
	start = 0;
	end = 0;
	searchContext = null;
	model = new Search('');
	objToSubmit = new Search('');
	facetObj: any;
	facetQuery: any;
	temp: any;
	response: any;

	constructor(
		private simpleSearchService: SimpleSearchService,
		private searchContextService: SearchContextService,
		public route: ActivatedRoute,
		public router: Router
	) {
	}
	
	ngOnInit(): void {
		this.route.queryParams.subscribe(params => {
			let q = params['q'];
			let fq = params['fq'];
			let p = params['p'];
			let searchContext = params['searchContext'];
			if (fq)
				fq = decodeURIComponent(fq).split("_SEP_");
			else
				fq = [];
			if (p && !isNaN(p)) {
				p = parseInt(p);
				this.size = p*10;
				this.page = p;
			}
			else
				p = 1;
			if (searchContext == null) {
				this.searchContextService.clearSearchContext();
			} else {
				this.searchContext = searchContext;
			}
			if (q)
				this.getCall(q,fq,p);
		});
    }
	
	get(search: Search): void {
		this.router.navigate(['/simple-search'], { queryParams : { q: search.q, fq: encodeURIComponent(this.facetQuery.join('_SEP_')), p: this.page, searchContext: this.searchContext } });
	}
	
	getCall(q:string, fq:any, p:number) {
		this.callback = false;
		this.error_detc = false;
		this.submitted = true;
		this.model.q=q;
		this.objToSubmit.q=q;
		this.facetQuery=fq;
		this.page=p;
		this.simpleSearchService.getFields()
		.then(res => {
			this.simpleSearchService.get(q,res._body.split(","),fq,p)
			.then(res => {
				this.facetObj = [];
				this.temp = [];
				var index = 0;
				for (let facet in res.facet_counts.facet_fields) {
					if (JSON.stringify(res.facet_counts.facet_fields[facet]) != "{}") {
						if (this.simpleSearchService.checkField(facet)) {
							this.facetObj.push({
								"name":facet,
								"options":[],
								"total":0,
								"selected":false
							});
							for (let facet_inner in res.facet_counts.facet_fields[facet]) {
								this.facetObj[index].options.push({
									"name":facet_inner,
									"count":res.facet_counts.facet_fields[facet][facet_inner]
								});
								this.facetObj[index].total += res.facet_counts.facet_fields[facet][facet_inner];
								if (this.checkFacet(this.facetObj[index].name,facet_inner))
									this.facetObj[index].selected=true;
							}
							this.facetObj[index].options.sort(function(a,b){
								var a_c = a.name;
								var b_c = b.name;
								return a_c.localeCompare(b_c);
							});
							this.facetObj[index].options.sort(function(a,b){
								return b.count-a.count;
							});
							index++;
							this.facetObj.sort(function(a,b){
								var a_c = a.name;
								var b_c = b.name;
								return a_c.localeCompare(b_c);
							});
							this.facetObj.sort(function(a,b){
								return b.total-a.total;
							});
							this.facetObj.sort(function(a,b){
								var ret = 0;
								if (a.selected && !b.selected)
									ret = -1;
								else if (!a.selected && b.selected)
									ret = 1;
								return ret;
							});
						}
					}
				}
				this.temp = res.response.docs;
				/*
				for (let doc in this.temp) {
					if (this.isJson(this.temp[doc][this.product_img])) {
						var json = JSON.parse(this.temp[doc][this.product_img]);
						var img = "";
						if (json.length > 1)
							img = "data:"+JSON.parse(this.temp[doc][this.product_img][0])[0].mimeCode+";base64,"+JSON.parse(this.temp[doc][this.product_img][0])[0].value;
						else
							img = "data:"+this.temp[doc][this.product_img].mimeCode+";base64,"+this.temp[doc][this.product_img].value;
						this.temp[doc][this.product_img] = img;
					}
				}
				*/
				this.response = JSON.parse(JSON.stringify(this.temp));
				this.size = res.response.numFound;
				this.page = p;
				this.start = this.page*10-10+1;
				this.end = this.start+res.response.docs.length-1;
				this.callback = true;
				this.error_detc = false;
			})
			.catch(error => {
				this.error_detc = true;
			});
		})
		.catch(error => {
			this.error_detc = true;
		});
	}
	
	onSubmit() {
		/*
		this.callback = false;
		this.error_detc = false;
		this.submitted = true;
		*/
		this.objToSubmit = JSON.parse(JSON.stringify(this.model));
		this.facetQuery = [];
		this.get(this.objToSubmit);
	}
	
	setFacet(outer:string, inner:string) {
		var fq = outer+":\""+inner+"\"";
		if (this.facetQuery.indexOf(fq) == -1)
			this.facetQuery.push(fq);
		else
			this.facetQuery.splice(this.facetQuery.indexOf(fq), 1);
		this.get(this.objToSubmit);
	}
	
	checkFacet(outer:string, inner:string): boolean {
		var match = false;
		var fq = outer+":\""+inner+"\"";
		if (this.facetQuery.indexOf(fq) != -1)
			match = true;
		return match;
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