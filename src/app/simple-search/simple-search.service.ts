import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import { map } from 'rxjs/operators';
import {CookieService} from "ng2-cookies";
import { DEFAULT_LANGUAGE, LANGUAGES } from '../catalogue/model/constants';
import {class_suggestion_field} from "../globals";


@Injectable()
export class SimpleSearchService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private url = myGlobals.indexing_service_endpoint;
    private facetMin = myGlobals.facet_min;
    private facetCount = myGlobals.facet_count;

	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor+"."+myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor+"."+myGlobals.product_vendor_name;
	product_img = myGlobals.product_img;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;
	product_configurable = myGlobals.product_configurable;
	product_cat = myGlobals.product_cat;
	product_cat_mix = myGlobals.product_cat_mix;
	class_suggestions_field = myGlobals.class_suggestion_field;

	constructor(private http: Http,
				private cookieService: CookieService) {
	}

    getUblProperties(facets){
		let url = this.url + `/property/search`;
		let searchObject: any = {};
		searchObject.rows = 2147483647;
		searchObject.start = 0;
		searchObject.q = "*:*";
		searchObject.fq = [];
		searchObject.fq.push("nameSpace:http://www.nimble-project.org/resource/ubl#")

        for(let facet of facets){
        	//url += "&localName="+encodeURIComponent(facet);
            // searchObject.fq.push("localName:" + facet)
		}
        return this.http
            .post(url, searchObject, {headers: this.headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    getFields(): Promise<any> {
		const url = this.url + `/item/fields`;
		// const url = `${this.url}/select?q=*:*&rows=0&wt=csv`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	get(query: string, facets: string[], facetQueries: string[], page: number, cat: string, catID: string): Promise<any> {
    let queryRes = this.buildQueryString(query,myGlobals.query_settings,true,false);
    query = queryRes.queryStr;
		const url = this.url + `/item/search`
		let searchObject:any = {};
		searchObject.rows = 10;
		searchObject.start = page-1;
		searchObject.q = query;
		for (let facet of facets) {
			if (facet.length === 0 || !facet.trim()) {}
			else {
				if(searchObject.facet == null) {
					searchObject.facet = {};
					searchObject.facet.field = [];
					searchObject.facet.minCount = this.facetMin;
					searchObject.facet.limit = this.facetCount;
				}
				searchObject.facet.field.push(facet)
			}
		}
		for (let facetQuery of facetQueries) {
			if(searchObject.fq == null) {
				searchObject.fq = [];
			}
			searchObject.fq.push(facetQuery);
		}
		if (cat != "") {
			var add_url = `${this.product_cat_mix}:"${catID}"`;
			if(searchObject.fq == null) {
				searchObject.fq = [];
			}
			searchObject.fq.push(add_url);
		}
		return this.http
		.post(url, searchObject, {headers: this.getHeadersWithBasicAuthorization()})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

    getSuggestions(query: string, item_field: string) {
    let querySettings = {
      "fields": [item_field],
      "boosting": false,
      "boostingFactors": {}
    };
    let queryRes = this.buildQueryString(query,querySettings,true,true);
    const url = this.url + `/item/search`
		let searchObject:any = {};
		searchObject.rows = 0;
		searchObject.q = queryRes.queryStr;
    searchObject.facet = {};
    searchObject.facet.field = [];
    searchObject.facet.limit = -1;
    for (let i=0; i<queryRes.queryFields.length; i++) {
            searchObject.facet.field.push(queryRes.queryFields[i]);
    }
    return this.http
		.post(url, searchObject, {headers: this.getHeadersWithBasicAuthorization()})
    .pipe(
			map(response =>
				this.getSuggestionArray(response.json(),query,queryRes.queryArr,queryRes.queryFields)
			)
		);
	}

  getClassSuggestions(query:string, field: string, ontology: string) {
    let querySettings = {
      "fields": [field],
      "boosting": false,
      "boostingFactors": {}
    };
    let queryRes = this.buildQueryString(query,querySettings,true,true);
    const url = this.url + `/class/search`
		let searchObject:any = {};
		searchObject.rows = 0;
		searchObject.q = "(" + queryRes.queryStr + ")";
    if (ontology != "") {
      let ontologyPrefixSimpleArr = ontology.split("/");
      let ontologyPrefixSimple = ontologyPrefixSimpleArr[ontologyPrefixSimpleArr.length-1];
      ontologyPrefixSimple.replace("#","");
      searchObject.q += " AND nameSpace:*"+ontologyPrefixSimple+"*";
    }
    searchObject.facet = {};
    searchObject.facet.field = [];
    searchObject.facet.limit = -1;
    for (let i=0; i<queryRes.queryFields.length; i++) {
      searchObject.facet.field.push(queryRes.queryFields[i]);
    }
    return this.http
		.post(url, searchObject, {headers: this.getHeadersWithBasicAuthorization()})
    .pipe(
			map(response =>
				this.getSuggestionArray(response.json(),query,queryRes.queryArr,queryRes.queryFields)
			)
		);
	}

	getSuggestionArray(res:any, q:string, qA:string[], fields:string[]): string[] {
		var suggestions=[];
    var suggestionsTmp=[];
    var suggestionsCount=[];
		if (q.length >= 2 && res.facets) {
      for (let i=0; i<fields.length; i++) {
        let field = fields[i];
        if (res.facets[field] && res.facets[field].entry && res.facets[field].entry.length > 0) {
          for (let sug of res.facets[field].entry) {
            if (sug["label"]) {
              let label = sug["label"];
              if (suggestionsTmp.indexOf(label) == -1) {
                suggestionsTmp.push(label);
                suggestionsCount.push({
                  "label": label,
                  "count": 0
                });
              }
            }
          }
        }
      }
      for (let i=0; i<suggestionsCount.length; i++) {
        let fullLabel = suggestionsCount[i].label.toLowerCase();;
        for (let j=0; j<qA.length; j++) {
          var idx = fullLabel.indexOf(qA[j].toLowerCase());
          if (idx != -1) {
            if (j == 0)
              suggestionsCount[i].count += 9999;
            else {
              suggestionsCount[i].count += (qA[j].length)*50;
              suggestionsCount[i].count += (qA.length-j)*20;
              suggestionsCount[i].count -= Math.min(Math.round(idx/2),20);
            }
          }
        }
      }
      suggestionsCount = suggestionsCount.sort(function(a,b){
          return b.count-a.count;
      });
      for (let i=0; i<Math.min(suggestionsCount.length,10); i++) {
          if (suggestionsCount[i].count > 0)
            suggestions.push(suggestionsCount[i].label);
      }
		}
		return suggestions;
	}

  buildQueryString(query:string, qS:any, full:boolean, allLang: boolean): any {
    if (query == "*") {
      return {
        "queryStr": "*",
        "queryArr": [],
        "queryFields": []
      };
    }
    query = query.replace(/[!'()]/g, '');
    query = query.trim();
    let splitQuery = [];
    if (full)
      splitQuery = query.split(" ");
    let queryArr = [query];
    let queryStr = "";
    let queryFields = [];
    let negativeBoosts = [];
    for (let i=0; i<qS.fields.length; i++) {
      let field = qS.fields[i];
      if (field.indexOf("{LANG}") != -1) {
        queryFields.push(field.replace("{LANG}","en"));
        if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field]) {
          qS.boostingFactors[field.replace("{LANG}","en")] = qS.boostingFactors[field];
          if (qS.boostingFactors[field]<0)
            negativeBoosts.push(field.replace("{LANG}","en"));
        }
        if (allLang) {
          for (let j=0; j<LANGUAGES.length; j++) {
            if (LANGUAGES[j] != "en") {
              queryFields.push(field.replace("{LANG}",LANGUAGES[j]));
              if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field]) {
                qS.boostingFactors[field.replace("{LANG}",LANGUAGES[j])] = qS.boostingFactors[field];
                if (qS.boostingFactors[field]<0)
                  negativeBoosts.push(field.replace("{LANG}",LANGUAGES[j]));
              }
            }
          }
        }
        else if (DEFAULT_LANGUAGE() != "en") {
          queryFields.push(field.replace("{LANG}",DEFAULT_LANGUAGE()));
          if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field]) {
            qS.boostingFactors[field.replace("{LANG}",DEFAULT_LANGUAGE())] = qS.boostingFactors[field];
            if (qS.boostingFactors[field]<0)
              negativeBoosts.push(field.replace("{LANG}",DEFAULT_LANGUAGE()));
          }
        }
      }
      else {
        queryFields.push(field);
        if (qS.boosting && qS.boostingFactors && qS.boostingFactors[field] && qS.boostingFactors[field]<0) {
          negativeBoosts.push(field);
        }
      }
    }
    for (let i=0; i<splitQuery.length; i++) {
      splitQuery[i] = splitQuery[i].replace(/ /g, '');
      if (splitQuery[i].length >= 2) {
        if (queryArr.indexOf(splitQuery[i]) == -1)
          queryArr.push(splitQuery[i]);
        let allLower = splitQuery[i].toLowerCase();
        if (queryArr.indexOf(allLower) == -1)
          queryArr.push(allLower);
        let allUpper = splitQuery[i].toUpperCase();
        if (queryArr.indexOf(allUpper) == -1)
          queryArr.push(allUpper);
        let firstCapital = allLower.substring(0,1).toUpperCase() + "" + allLower.substring(1,allLower.length);
        if (queryArr.indexOf(firstCapital) == -1)
          queryArr.push(firstCapital);
      }
    }
    for (let i=0; i<queryArr.length; i++) {
      for (let j=0; j<queryFields.length; j++) {
        if (queryFields[j] != "STANDARD") {
          queryStr += queryFields[j] + ":*" + queryArr[i] +"*";
        }
        else {
          if (negativeBoosts.length > 0) {
            queryStr += "(*" + queryArr[i] +"* ";
            for (let k=0; k<negativeBoosts.length; k++) {
              queryStr += "AND ((" + negativeBoosts[k] + ":* -*"+ queryArr[i] + "*) OR (-" + negativeBoosts[k] + ":[* TO *] AND *:*)) ";
            }
            queryStr += ")";
          }
          else
            queryStr += "*" + queryArr[i] +"*";
        }
        if (qS.boosting && queryFields[j] != class_suggestion_field) {
            queryStr += "^" + Math.abs(qS.boostingFactors[queryFields[j]]);
        }

        queryStr += " ";
      }
    }
    return {
      "queryStr": queryStr,
      "queryArr": queryArr,
      "queryFields": queryFields
    };
  }

	checkField(field:string): boolean {
		if (field == this.product_name || field == this.product_img || field == this.product_vendor_id || field == this.product_cat || field == this.product_cat_mix) {
			return false;
		}
		for (let filter of this.product_nonfilter_full) {
			if (field == filter)
				return false;
		}
		for (let filter of this.product_nonfilter_regex) {
			if (field.search(filter) != -1)
				return false;
		}
		for (let filter of this.product_configurable) {
			if (field.search(filter) != -1)
				return false;
		}
		return true;
	}

	private getHeadersWithBasicAuthorization(): Headers {
		const headers = new Headers();
		this.headers.keys().forEach(header => headers.append(header, this.headers.get(header)));
		headers.append('Authorization', "Basic " + btoa("admin:*platform*"));
		return headers;
	}

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}

	getCompanies(query: string, facets: string[], facetQueries: string[]): Promise<any> {
		query = query.replace(/[!'()]/g, '');
		// var start = page*10-10;
		const url = this.url + `/party/search`

		let searchObject:any = {};
		searchObject.rows = facetQueries.length;

		searchObject.q = query;

		var full_url = url + "";
		for (let facet of facets) {
			if (facet.length === 0 || !facet.trim()) {}
			else {
				//full_url += "&facet.field=" + facet;
				if(searchObject.facet == null) {
					searchObject.facet = {};
					searchObject.facet.field = [];
					searchObject.facet.minCount = this.facetMin;
					searchObject.facet.limit = this.facetCount;
				}
				searchObject.facet.field.push(facet)
			}
		}
		return this.http
		.post(url, searchObject, {headers: this.getHeadersWithBasicAuthorization()})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}


	getFavouriteSearch(query: string, facets: string[],page?: number,sortType?:string): Promise<any> {
    query = query;
		const url = this.url + `/item/search`;
		let searchObject:any = {};
		searchObject.rows = 10;
		searchObject.start = page-1;
    searchObject.q = query;
    searchObject.sort = [];
    if(sortType === "PRICE_HIGH_TO_LOW"){
      searchObject.sort.push("eUR_price desc");
    }else{
      searchObject.sort.push("eUR_price asc");
    }
		for (let facet of facets) {
			if (facet.length === 0 || !facet.trim()) {}
			else {
				if(searchObject.facet == null) {
					searchObject.facet = {};
					searchObject.facet.field = [];
					searchObject.facet.minCount = this.facetMin;
					searchObject.facet.limit = this.facetCount;
				}
				searchObject.facet.field.push(facet)
			}
		}
		return this.http
		.post(url, searchObject, {headers: this.getHeadersWithBasicAuthorization()})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

  getCompanyBasedProductsAndServices(query: string, facets: string[], facetQueries: string[], page: number, cat: string, catID: string): Promise<any> {
    // let queryRes = this.buildQueryString(query,myGlobals.query_settings,true,false);
    // query = queryRes.queryStr;
		const url = this.url + `/item/search`
		let searchObject:any = {};
		searchObject.rows = 10;
		searchObject.start = page-1;
		searchObject.q = query;
		for (let facet of facets) {
			if (facet.length === 0 || !facet.trim()) {}
			else {
				if(searchObject.facet == null) {
					searchObject.facet = {};
					searchObject.facet.field = [];
					searchObject.facet.minCount = this.facetMin;
					searchObject.facet.limit = this.facetCount;
				}
				searchObject.facet.field.push(facet)
			}
		}
		for (let facetQuery of facetQueries) {
			if(searchObject.fq == null) {
				searchObject.fq = [];
			}
			searchObject.fq.push(facetQuery);
		}
		if (cat != "") {
			var add_url = `${this.product_cat_mix}:"${catID}"`;
			if(searchObject.fq == null) {
				searchObject.fq = [];
			}
			searchObject.fq.push(add_url);
		}
		return this.http
		.post(url, searchObject, {headers: this.getHeadersWithBasicAuthorization()})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
}
