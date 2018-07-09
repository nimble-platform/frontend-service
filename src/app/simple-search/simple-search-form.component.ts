import { Component, OnInit } from '@angular/core';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';
import { Router, ActivatedRoute} from "@angular/router";
import * as myGlobals from '../globals';
import {SearchContextService} from "./search-context.service";
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, catchError } from 'rxjs/operators';

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
	product_cat = myGlobals.product_cat;
	product_cat_mix = myGlobals.product_cat_mix;

	submitted = false;
	callback = false;
	error_detc = false;
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
				this.error_detc = false;
				this.submitted = false;
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

	getCatTree(): void {
		this.simpleSearchService.get("*",[this.product_cat_mix],[""],1,"")
		.then(res => {
			for (let facet in res.facet_counts.facet_fields) {
				if (facet == this.product_cat_mix) {
					this.buildCatTree(res.facet_counts.facet_fields[facet]);
				}
			}
		});
	}

	buildCatTree(mix: any): void {
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

	getCatLevel(name:string): number {
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

	getCall(q:string, fq:any, p:number, cat:string) {
		this.callback = false;
		this.error_detc = false;
		this.submitted = true;
    this.model.q=q;
		this.objToSubmit.q=q;
		this.facetQuery=fq;
		this.page=p;
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
								if (facet_inner != "") {
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
		//this.facetQuery = [];
		this.get(this.objToSubmit);
	}

	callCat(name:string) {
		this.model.q="*";
		this.objToSubmit = JSON.parse(JSON.stringify(this.model));
		//this.facetQuery = [];
		this.cat = name;
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

	setCat(name:string) {
		this.cat = name;
		this.get(this.objToSubmit);
	}

	resetFilter() {
		this.facetQuery = [];
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
