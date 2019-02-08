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
import { CategoryService } from '../catalogue/category/category.service';
import { Category } from '../catalogue/model/category/category';
import { DEFAULT_LANGUAGE} from '../catalogue/model/constants';

@Component({
	selector: 'simple-search-form',
	templateUrl: './simple-search-form.component.html',
	styleUrls: ['./simple-search-form.component.css']
})

export class SimpleSearchFormComponent implements OnInit {

	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor_name;
	product_vendor_rating = myGlobals.product_vendor_rating;
	product_vendor_rating_seller = myGlobals.product_vendor_rating_seller;
	product_vendor_rating_fulfillment = myGlobals.product_vendor_rating_fulfillment;
	product_vendor_rating_delivery = myGlobals.product_vendor_rating_delivery;
	product_vendor_trust = myGlobals.product_vendor_trust;
	product_img = myGlobals.product_img;
	product_price = myGlobals.product_price;
	product_currency = myGlobals.product_currency;
	product_filter_prod = myGlobals.product_filter_prod;
	product_filter_comp = myGlobals.product_filter_comp;
	product_filter_trust = myGlobals.product_filter_trust;
	product_filter_mappings = myGlobals.product_filter_mappings;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;
	product_cat = myGlobals.product_cat;
	product_cat_mix = myGlobals.product_cat_mix;

	CURRENCIES = CURRENCIES;
	selectedCurrency: any = "EUR";
	selectedPriceMin: any;
	selectedPriceMax: any;

	ratingOverall = 0;
	ratingSeller = 0;
	ratingFulfillment = 0;
	ratingDelivery = 0;
	ratingTrust = 0;

	showCatSection = true;
	showProductSection = false;
	showCompSection = false;
	showTrustSection = false;
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
	catID = "";
	cat_level = -2;
	cat_levels = [];
	cat_other = [];
	cat_other_count = 0;
	cat_loading = true;
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

	config = myGlobals.config;

	constructor(
		private simpleSearchService: SimpleSearchService,
		private searchContextService: SearchContextService,
		private categoryService: CategoryService,
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
			let catID = params['catID'];
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
			if (catID) {
				this.catID = catID;
			}
			else
				this.catID = "";
			if (searchContext == null) {
				this.searchContextService.clearSearchContext();
			} else {
				this.searchContext = searchContext;
			}
			if (q)
				this.getCall(q,fq,p,cat,catID);
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
				cat: this.cat,
				catID: this.catID
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
		this.simpleSearchService.get("*",[this.product_cat_mix],[""],1,"","")
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
		this.cat_loading = true;
		var taxonomy = "eClass";
		if (this.config.standardTaxonomy.localeCompare("All") != 0 && this.config.standardTaxonomy.localeCompare("eClass") != 0) {
			taxonomy = this.config.standardTaxonomy;
		}
		var taxonomyPrefix = "";
		if (this.config.categoryFilter[taxonomy] && this.config.categoryFilter[taxonomy].ontologyPrefix)
			taxonomyPrefix = this.config.categoryFilter[taxonomy].ontologyPrefix;
		if (taxonomyPrefix != "") {
			// ToDo: Remove manual distinction after search update
			// ================================================================================
			if (taxonomy == "eClass") {
				this.cat_levels = [[],[],[],[]];
				for (let facet_inner in mix) {
					var count = mix[facet_inner];
					var split_idx = facet_inner.lastIndexOf(":");
					var ontology = facet_inner.substr(0,split_idx);
					var name = facet_inner.substr(split_idx+1);
					if (ontology.indexOf(taxonomyPrefix) != -1) {
						var eclass_idx = parseInt(ontology.split(taxonomyPrefix)[1]);
						if (eclass_idx%1000000==0) {
							this.cat_levels[0].push({"name":name,"id":ontology,"count":count});
						}
						else if(eclass_idx%10000==0) {
							this.cat_levels[1].push({"name":name,"id":ontology,"count":count});
						}
						else if(eclass_idx%100==0) {
							this.cat_levels[2].push({"name":name,"id":ontology,"count":count});
						}
						else {
							this.cat_levels[3].push({"name":name,"id":ontology,"count":count});
						}
					}
				}
				this.sortCatLevels();
			}
			// ================================================================================
			// if (this.cat == "") {
			else if (this.cat == "") {
				this.categoryService
					.getRootCategories(taxonomy)
					.then(rootCategories => {
							var rootCategories = rootCategories;
							this.cat_levels = [];
							var lvl = [];
							for (let facet_inner in mix) {
								var count = mix[facet_inner];
								var split_idx = facet_inner.lastIndexOf(":");
								var ontology = facet_inner.substr(0,split_idx);
								var name = facet_inner.substr(split_idx+1);
								if (ontology.indexOf(taxonomyPrefix) != -1) {
									if (this.findCategory(rootCategories,ontology) != -1 && this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(name) == -1)
										lvl.push({"name":name,"id":ontology,"count":count});
								}
							}
							this.cat_levels.push(lvl);
							this.sortCatLevels();
					})
			}
			else {
				var catToSubmit = new Category(this.catID,null,null,null,null,null,null,null,null,taxonomy,this.catID);
				this.categoryService
          .getParentCategories(catToSubmit)
					.then(res => {
							var catLevels = res.categories;
							this.cat_levels = [];
							for (var i=0; i<catLevels.length; i++) {
								var lvl = [];
								for (let facet_inner in mix) {
									var count = mix[facet_inner];
									var split_idx = facet_inner.lastIndexOf(":");
									var ontology = facet_inner.substr(0,split_idx);
									var name = facet_inner.substr(split_idx+1);
									if (ontology.indexOf(taxonomyPrefix) != -1) {
										if (this.findCategory(catLevels[i],ontology) != -1 && this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(name) == -1)
											lvl.push({"name":name,"id":ontology,"count":count});
									}
								}
								this.cat_levels.push(lvl);
							}
							this.sortCatLevels();
					})
			}
		}
	}

	private findCategory(categoryArray: Category[], uri: String): number {
			return categoryArray.findIndex(c => c.categoryUri == uri);
	}

	private sortCatLevels() {
		for (var i=0; i<this.cat_levels.length; i++) {
			this.cat_levels[i].sort(function(a,b){
				var a_c = a.name;
				var b_c = b.name;
				return a_c.localeCompare(b_c);
			});
			this.cat_levels[i].sort(function(a,b){
				return b.count-a.count;
			});
		}
		this.cat_level = this.getCatLevel(this.cat);
		this.cat_loading = false;
	}

	private getCatLevel(name:string): number {
		var level = -2;
		if (name != "")
			level = -1;
		for (var j=0; j<this.cat_levels.length; j++) {
			for (var i=0; i<this.cat_levels[j].length; i++) {
				var comp = this.cat_levels[j][i].name;
				if (comp.localeCompare(name) == 0) {
					level = j;
				}
			}
		}
		return level;
	}

	private getCall(q:string, fq:any, p:number, cat:string, catID:string) {
		this.cat_loading = true;
		this.searchDone = true;
    	this.model.q=q;
		this.objToSubmit.q=q;
		this.facetQuery=fq;
		this.page=p;
		this.searchCallStatus.submit();
		this.simpleSearchService.getFields()
		.then(res => {
			this.simpleSearchService.getPropertyLabels(res._body.split(",")).then(propertyLabelsRes => {
                this.simpleSearchService.get(q,res._body.split(","),fq,p,cat,catID)
                    .then(res => {
                        let propertyLabels = propertyLabelsRes.response.docs;
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
                                        "realName":this.getFacetRealName(facet,propertyLabels),
                                        "options":[],
                                        "total":0,
                                        "selected":false
                                    });

                                    // check whether we have specific labels for the default language settings
                                    let label = null;
                                    let facet_innerLabel = null;
                                    let facet_innerCount = null;
                                    for (let facet_inner in res.facet_counts.facet_fields[facet]) {
                                        let index = facet_inner.lastIndexOf(":"+DEFAULT_LANGUAGE());
                                        if (index != -1) {
                                            label = facet_inner.substring(0,index);
                                            facet_innerLabel = facet_inner;
                                            facet_innerCount = res.facet_counts.facet_fields[facet][facet_inner];
                                        }
                                    }

                                    if(label == null){
                                        for (let facet_inner in res.facet_counts.facet_fields[facet]) {
                                            if (facet_inner != "" && facet_inner != ":" && facet_inner != ' ' && facet_inner.indexOf("urn:oasis:names:specification:ubl:schema:xsd") == -1) {
                                                this.facetObj[index].options.push({
                                                    "name":facet_inner,
                                                    "realName":facet_inner,
                                                    "count":res.facet_counts.facet_fields[facet][facet_inner]
                                                });
                                                this.facetObj[index].total += res.facet_counts.facet_fields[facet][facet_inner];
                                                if (this.checkFacet(this.facetObj[index].name,facet_inner))
                                                    this.facetObj[index].selected=true;
                                            }
                                        }
                                    }
                                    else {
                                        this.facetObj[index].options.push({
                                            "name":facet_innerLabel,
                                            "realName":label,
                                            "count":facet_innerCount
                                        });
                                        this.facetObj[index].total += res.facet_counts.facet_fields[facet][facet_innerLabel];
                                        if (this.checkFacet(this.facetObj[index].name,facet_innerLabel))
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
            }).catch(error => {
                this.searchCallStatus.error("Failed to get property labels",error);
            })
		})
		.catch(error => {
			this.searchCallStatus.error("Error while running search.", error);
		});
	}

    getFacetRealName(name:string,properties){
        for(let property of properties){
            if(property["idxField"].indexOf(name) != -1){
                // get label key
                let objectKeys = Object.keys(property);

                if(objectKeys.length < 2){
                    // we do not have a specific label for this facet
                    break;
                }

                let defaultLanguage = DEFAULT_LANGUAGE();

                if(objectKeys.indexOf("label_"+defaultLanguage) != -1){
                	return property["label_"+defaultLanguage][0];
				}
				else if(objectKeys.indexOf("label_en") != -1){
                    return property["label_en"][0];
				}

                objectKeys.splice(objectKeys.indexOf("idxField"),1);
                let labelField = objectKeys[0];
                return property[labelField][0];
            }
        }

        return name;
    }

    onSubmit() {
        this.objToSubmit = copy(this.model);
        this.page = 1;
        this.get(this.objToSubmit);
    }

	callCat(name:string,id:string) {
		this.model.q="*";
		this.objToSubmit = copy(this.model);
		this.cat = name;
		this.catID = id;
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

	checkTrustFilter() {
		var check = false;
		if (this.ratingOverall > 0 || this.ratingSeller > 0 || this.ratingFulfillment > 0 || this.ratingDelivery > 0 || this.ratingTrust > 0)
			check = true;
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

	checkTrustFacet() {
		var found = false;
		for (var i=0; i<this.facetQuery.length; i++) {
			var comp = this.facetQuery[i].split(":")[0];
			if (comp.localeCompare(this.product_vendor_rating) == 0 || comp.localeCompare(this.product_vendor_rating_seller) == 0 || comp.localeCompare(this.product_vendor_rating_fulfillment) == 0 || comp.localeCompare(this.product_vendor_rating_delivery) == 0 || comp.localeCompare(this.product_vendor_trust) == 0) {
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

	setTrustFilter() {
		this.clearFacet(this.product_vendor_rating);
		this.clearFacet(this.product_vendor_rating_seller);
		this.clearFacet(this.product_vendor_rating_fulfillment);
		this.clearFacet(this.product_vendor_rating_delivery);
		this.clearFacet(this.product_vendor_trust);
		if (this.ratingOverall > 0)
			this.setRangeWithoutQuery(this.product_vendor_rating,this.ratingOverall,5);
		if (this.ratingSeller > 0)
			this.setRangeWithoutQuery(this.product_vendor_rating_seller,this.ratingSeller,5);
		if (this.ratingFulfillment > 0)
			this.setRangeWithoutQuery(this.product_vendor_rating_fulfillment,this.ratingFulfillment,5);
		if (this.ratingDelivery > 0)
			this.setRangeWithoutQuery(this.product_vendor_rating_delivery,this.ratingDelivery,5);
		if (this.ratingTrust > 0)
			this.setRangeWithoutQuery(this.product_vendor_trust,(this.ratingTrust/5),1);
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

	resetTrustFilter() {
		this.ratingOverall = 0;
		this.ratingSeller = 0;
		this.ratingFulfillment = 0;
		this.ratingDelivery = 0;
		this.ratingTrust = 0;
		this.clearFacet(this.product_vendor_rating);
		this.clearFacet(this.product_vendor_rating_seller);
		this.clearFacet(this.product_vendor_rating_fulfillment);
		this.clearFacet(this.product_vendor_rating_delivery);
		this.clearFacet(this.product_vendor_trust);
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

	checkTrustCat(name:string) {
		var found = false;
		if (this.product_filter_trust.indexOf(name) != -1) {
			found = true;
		}
		return found;
	}

	checkTrustCatCount() {
		var count = 0;
		if (this.facetObj) {
			for (var i=0; i<this.facetObj.length; i++) {
				if (this.checkTrustCat(this.facetObj[i].name)) {
					count++;
				}
			}
		}
		return count;
	}

	checkOtherCat(name:string) {
		return (!this.checkProdCat(name) && !this.checkCompCat(name) && !this.checkTrustCat(name));
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

	setCat(name:string,id:string) {
		this.cat = name;
		this.catID = id;
		this.get(this.objToSubmit);
	}

	resetFilter() {
		this.facetQuery = [];
		this.selectedCurrency = "EUR";
		this.selectedPriceMin = null;
		this.selectedPriceMax = null;
		this.ratingOverall = 0;
		this.ratingSeller = 0;
		this.ratingFulfillment = 0;
		this.ratingDelivery = 0;
		this.ratingTrust = 0;
		this.get(this.objToSubmit);
	}

	checkFacet(outer:string, inner:string): boolean {
		var match = false;
		var fq = outer+":\""+inner+"\"";
		if (this.facetQuery.indexOf(fq) != -1)
			match = true;
		return match;
	}

	checkNaN(rating:any): boolean {
		var nan = false;
		if (isNaN(parseFloat(rating)))
			nan = true;
		return nan;
	}

	calcRating(rating:any,multiplier:number): number {
		var result = parseFloat(rating)*multiplier;
		var rounded = Math.round(result*10)/10;
		return rounded;
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
