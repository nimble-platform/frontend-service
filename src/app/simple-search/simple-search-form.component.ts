import { Component, OnInit } from '@angular/core';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';
import { Router, ActivatedRoute} from "@angular/router";
import * as myGlobals from '../globals';
import {SearchContextService} from "./search-context.service";
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { copy } from '../common/utils';
import { CallStatus } from '../common/call-status';
import { CURRENCIES } from "../catalogue/model/constants";

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
	product_price = myGlobals.product_price;
	product_currency = myGlobals.product_currency;
	product_filter_prod = myGlobals.product_filter_prod;
	product_filter_comp = myGlobals.product_filter_comp;
	product_filter_mappings = myGlobals.product_filter_mappings;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;
	product_cat = myGlobals.product_cat;
	product_cat_mix = myGlobals.product_cat_mix;

	CURRENCIES = CURRENCIES;
	selectedCurrency: any = "EUR";
	selectedPriceMin: any;
	selectedPriceMax: any;

	showCatSection = true;
	showProductSection = false;
	showCompSection = false;
	showOtherSection = false;

	categoriesCallStatus: CallStatus = new CallStatus();
	searchCallStatus: CallStatus = new CallStatus();
	searchDone = false;
	callback = false;
	showOther = false;
	size = 0;
	page = 1;
	start = 0;
	end = 0;
	cat = "";
	cat_level = -2;
	cat_levels = [];
	cat_other = [];
	cat_other_count = 0;
	suggestions = [];
	searchContext = null;
	model = new Search('');
	objToSubmit = new Search('');
	facetObj: any;
	facetQuery: any;
	temp: any;
	response: any;
    // check whether 'p' query parameter exists or not
	noP = true;
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
			let cat = params['cat'];
			if(p){
				this.noP = false;
			}
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
			if (cat) {
				this.cat = cat;
			}
			else
				this.cat = "";
			if (searchContext == null) {
				this.searchContextService.clearSearchContext();
			} else {
				this.searchContext = searchContext;
			}
			if (q)
				this.getCall(q,fq,p,cat);
			else {
				this.callback = false;
				this.searchDone = false;
				this.searchCallStatus.reset();
		    	this.model.q='';
				this.objToSubmit.q='';
				this.facetQuery=fq;
				this.page=p;
				this.getCatTree();
			}
		});
    }

	get(search: Search): void {
		this.router.navigate(['/simple-search'], {
			queryParams: {
				q: search.q,
				fq: encodeURIComponent(this.facetQuery.join('_SEP_')),
				p: this.page,
				searchContext: this.searchContext,
				cat: this.cat
			}
		});
	}

	getSuggestions = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(term =>
        this.simpleSearchService.getSuggestions(term,this.facetQuery,this.cat)
      )
    );

	private getCatTree(): void {
		this.categoriesCallStatus.submit();
		this.simpleSearchService.get("*",[this.product_cat_mix],[""],1,"")
		.then(res => {
			for (let facet in res.facet_counts.facet_fields) {
				if (facet == this.product_cat_mix) {
					this.buildCatTree(res.facet_counts.facet_fields[facet]);
				}
			}
			this.categoriesCallStatus.callback("Categories loaded.", true);
		})
		.catch(error => {
			this.categoriesCallStatus.error("Error while loading category tree.", error);
		});
	}

	private buildCatTree(mix: any): void {
		this.cat_levels = [[],[],[],[]];
		this.cat_other = [];
		this.cat_other_count = 0;
		for (let facet_inner in mix) {
			var count = mix[facet_inner];
			var split_idx = facet_inner.lastIndexOf(":");
			var ontology = facet_inner.substr(0,split_idx);
			var name = facet_inner.substr(split_idx+1);
			if (ontology.indexOf("http://www.nimble-project.org/resource/eclass/") == -1) {
				this.cat_other.push({"name":name,"count":count});
				this.cat_other_count += count;
			}
			else {
				var eclass_idx = parseInt(ontology.split("http://www.nimble-project.org/resource/eclass/")[1]);
				if (eclass_idx%1000000==0) {
					this.cat_levels[0].push({"name":name,"count":count});
				}
				else if(eclass_idx%10000==0) {
					this.cat_levels[1].push({"name":name,"count":count});
				}
				else if(eclass_idx%100==0) {
					this.cat_levels[2].push({"name":name,"count":count});
				}
				else {
					this.cat_levels[3].push({"name":name,"count":count});
				}
			}
		}
		for (var i=0; i<4; i++) {
			this.cat_levels[i].sort(function(a,b){
				var a_c = a.name;
				var b_c = b.name;
				return a_c.localeCompare(b_c);
			});
			this.cat_levels[i].sort(function(a,b){
				return b.count-a.count;
			});
		}
		this.cat_other.sort(function(a,b){
			var a_c = a.name;
			var b_c = b.name;
			return a_c.localeCompare(b_c);
		});
		this.cat_other.sort(function(a,b){
			return b.count-a.count;
		});
		this.cat_level = this.getCatLevel(this.cat);
	}

	private getCatLevel(name:string): number {
		var level = -2;
		if (name != "")
			level = -1;
		for (var i=0; i<this.cat_levels[0].length; i++) {
			var comp = this.cat_levels[0][i].name;
			if (comp.localeCompare(name) == 0) {
				level = 0;
			}
		}
		for (var i=0; i<this.cat_levels[1].length; i++) {
			var comp = this.cat_levels[1][i].name;
			if (comp.localeCompare(name) == 0) {
				level = 1;
			}
		}
		for (var i=0; i<this.cat_levels[2].length; i++) {
			var comp = this.cat_levels[2][i].name;
			if (comp.localeCompare(name) == 0) {
				level = 2;
			}
		}
		for (var i=0; i<this.cat_levels[3].length; i++) {
			var comp = this.cat_levels[3][i].name;
			if (comp.localeCompare(name) == 0) {
				level = 3;
			}
		}
		return level;
	}

	private getCall(q:string, fq:any, p:number, cat:string) {
		this.searchDone = true;
    	this.model.q=q;
		this.objToSubmit.q=q;
		this.facetQuery=fq;
		this.page=p;
		this.searchCallStatus.submit();
		this.simpleSearchService.getFields()
		.then(res => {
			this.simpleSearchService.get(q,res._body.split(","),fq,p,cat)
			.then(res => {
				this.facetObj = [];
				this.temp = [];
				var index = 0;
				for (let facet in res.facet_counts.facet_fields) {
					if (JSON.stringify(res.facet_counts.facet_fields[facet]) != "{}") {
						if (facet == this.product_cat_mix) {
							this.buildCatTree(res.facet_counts.facet_fields[facet]);
						}
						if (this.simpleSearchService.checkField(facet)) {
							this.facetObj.push({
								"name":facet,
								"options":[],
								"total":0,
								"selected":false
							});
							for (let facet_inner in res.facet_counts.facet_fields[facet]) {
								if (facet_inner != "" && facet_inner.indexOf("urn:oasis:names:specification:ubl:schema:xsd") == -1) {
									this.facetObj[index].options.push({
										"name":facet_inner,
										"count":res.facet_counts.facet_fields[facet][facet_inner]
									});
									this.facetObj[index].total += res.facet_counts.facet_fields[facet][facet_inner];
									if (this.checkFacet(this.facetObj[index].name,facet_inner))
										this.facetObj[index].selected=true;
								}
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
				for (let doc in this.temp) {
					if (this.temp[doc][this.product_img]) {
						var img = this.temp[doc][this.product_img];
						if (Array.isArray(img)) {
							this.temp[doc][this.product_img] = img[0];
						}
					}
				}
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
				this.response = copy(this.temp);
				this.size = res.response.numFound;
				this.page = p;
				this.start = this.page*10-10+1;
				this.end = this.start+res.response.docs.length-1;
				this.callback = true;
				this.searchCallStatus.callback("Search done.", true);
			})
			.catch(error => {
				this.searchCallStatus.error("Error while running search.", error);
			});
		})
		.catch(error => {
			this.searchCallStatus.error("Error while running search.", error);
		});
	}

	onSubmit() {
		this.objToSubmit = copy(this.model);
		this.get(this.objToSubmit);
	}

	callCat(name:string) {
		this.model.q="*";
		this.objToSubmit = copy(this.model);
		this.cat = name;
		this.get(this.objToSubmit);
	}

	getName(name:string) {
		var ret = name;
		if (this.product_filter_mappings[name]) {
			ret = this.product_filter_mappings[name];
		}
		return ret;
	}

	checkPriceFilter() {
		var check = false;
		if (this.selectedCurrency && this.selectedPriceMin && this.selectedPriceMax) {
			if (this.selectedPriceMin < this.selectedPriceMax) {
				check = true;
			}
		}
		return check;
	}

	checkPriceFacet() {
		var found = false;
		for (var i=0; i<this.facetQuery.length; i++) {
			var comp = this.facetQuery[i].split(":")[0];
			if (comp.localeCompare(this.product_currency) == 0 || comp.localeCompare(this.product_price) == 0) {
				found = true;
			}
		}
		return found;
	}

	setPriceFilter() {
		this.clearFacet(this.product_currency);
		this.clearFacet(this.product_price);
		this.setFacetWithoutQuery(this.product_currency,this.selectedCurrency);
		this.setRangeWithoutQuery(this.product_price,this.selectedPriceMin,this.selectedPriceMax);
		this.get(this.objToSubmit);
	}

	resetPriceFilter() {
		this.selectedCurrency = "EUR";
		this.selectedPriceMin = null;
		this.selectedPriceMax = null;
		this.clearFacet(this.product_currency);
		this.clearFacet(this.product_price);
		this.get(this.objToSubmit);
	}

	checkProdCat(name:string) {
		var found = false;
		if (this.product_filter_prod.indexOf(name) != -1) {
			found = true;
		}
		return found;
	}

	checkProdCatCount() {
		var count = 1;
		if (this.facetObj) {
			for (var i=0; i<this.facetObj.length; i++) {
				if (this.checkProdCat(this.facetObj[i].name)) {
					count++;
				}
			}
		}
		return count;
	}

	checkCompCat(name:string) {
		var found = false;
		if (this.product_filter_comp.indexOf(name) != -1) {
			found = true;
		}
		return found;
	}

	checkCompCatCount() {
		var count = 0;
		if (this.facetObj) {
			for (var i=0; i<this.facetObj.length; i++) {
				if (this.checkCompCat(this.facetObj[i].name)) {
					count++;
				}
			}
		}
		return count;
	}

	checkOtherCat(name:string) {
		return (!this.checkProdCat(name) && !this.checkCompCat(name));
	}

	checkOtherCatCount() {
		var count = 0;
		if (this.facetObj) {
			for (var i=0; i<this.facetObj.length; i++) {
				if (this.checkOtherCat(this.facetObj[i].name)) {
					count++;
				}
			}
		}
		return count;
	}

	clearFacet(outer:string) {
		var idx = -1;
		for (var i=0; i<this.facetQuery.length; i++) {
			var comp = this.facetQuery[i].split(":")[0];
			if (comp.localeCompare(outer) == 0) {
				idx = i;
			}
		}
		if (idx >= 0) {
			this.facetQuery.splice(idx, 1);
		}
	}

	setFacet(outer:string, inner:string) {
		var fq = outer+":\""+inner+"\"";
		if (this.facetQuery.indexOf(fq) == -1)
			this.facetQuery.push(fq);
		else
			this.facetQuery.splice(this.facetQuery.indexOf(fq), 1);
		this.get(this.objToSubmit);
	}

	setFacetWithoutQuery(outer:string, inner:string) {
		var fq = outer+":\""+inner+"\"";
		this.facetQuery.push(fq);
	}

	setRangeWithoutQuery(outer:string, min:number, max:number) {
		var fq = outer+":["+min+" TO "+max+"]";
		this.facetQuery.push(fq);
	}

	setCat(name:string) {
		this.cat = name;
		this.get(this.objToSubmit);
	}

	resetFilter() {
		this.facetQuery = [];
		this.selectedCurrency = "EUR";
		this.selectedPriceMin = null;
		this.selectedPriceMax = null;
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
