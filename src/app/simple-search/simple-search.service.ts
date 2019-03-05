import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';
import { map } from 'rxjs/operators';
import { getAuthorizedHeaders } from '../common/utils'
import {CookieService} from "ng2-cookies";
import { DEFAULT_LANGUAGE } from '../catalogue/model/constants';

@Injectable()
export class SimpleSearchService {

    private headers = new Headers({'Content-Type': 'application/json'});
    private indexingServiceUrl = myGlobals.indexing_service_endpoint;
    private url = myGlobals.simple_search_endpoint;
    private urlProperty = myGlobals.simple_search_properties_endpoint;
    private facetMin = myGlobals.facet_min;

	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor+"."+myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor+"."+myGlobals.product_vendor_name;
	product_img = myGlobals.product_img;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;
	product_configurable = myGlobals.product_configurable;
	product_cat = myGlobals.product_cat;
	product_cat_mix = myGlobals.product_cat_mix;

	constructor(private http: Http,
				private cookieService: CookieService) {
	}

    getUblProperties(facets){
		let url = this.indexingServiceUrl + `/property/search`;
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
		const url = this.indexingServiceUrl + `/item/fields`;
		// const url = `${this.url}/select?q=*:*&rows=0&wt=csv`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	get(query: string, facets: string[], facetQueries: string[], page: number, cat: string, catID: string): Promise<any> {
		query = query.replace(/[!'()]/g, '');
		// var start = page*10-10;
		const url = this.indexingServiceUrl + `/item/search`

		let searchObject:any = {};
		searchObject.rows = 10;
		searchObject.start = page-1;
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
				}
				searchObject.facet.field.push(facet)
			}
		}

		for (let facetQuery of facetQueries) {
			//full_url += "&fq="+encodeURIComponent(facetQuery);
			if(searchObject.fq == null) {
				searchObject.fq = [];
			}
			searchObject.fq.push(facetQuery);
		}
		if (cat != "") {
			var add_url = `${this.product_cat_mix}:"${catID}"`;
			//full_url += "&fq="+encodeURIComponent(add_url);
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

	getSingle(id: string): Promise<any> {
		const url = `${this.url}/select?q=*&rows=1&wt=json&fq=item_id:${id}`;
		return this.http
		.get(url, {headers: this.getHeadersWithBasicAuthorization()})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}

	getSuggestions(query:string, facetQueries: [string], cat: string) {
		query = query.replace(/[!'()]/g, '');
		const url = `${this.url}/suggest?q=${query}&wt=json`;
		var full_url = url + "";
		for (let facetQuery of facetQueries) {
			full_url += "&fq="+encodeURIComponent(facetQuery);
		}
		if (cat != "") {
			var add_url = `${this.product_cat}:"${cat}"`;
			full_url += "&fq="+encodeURIComponent(add_url);
		}
		return this.http
		.get(full_url, {headers: this.getHeadersWithBasicAuthorization()})
		.pipe(
			map(response =>
				this.getSuggestionArray(response,query)
			)
		);
	}

	getSuggestionArray(res:any, q:string): string[] {
		let defaultLanguage = DEFAULT_LANGUAGE();
		var suggestions=[];
		if (q.length >= 2) {
			res = JSON.parse(res._body);
			if (res && res.suggestions && res.suggestions.suggestion_facets && res.suggestions.suggestion_facets[this.product_name]) {
				for (let sug in res.suggestions.suggestion_facets[this.product_name]) {
					// get the language id of the value
                    let index = sug.lastIndexOf(":");
                    let languageId = sug.substring(index+1);
					if (suggestions.length<10 && languageId == defaultLanguage)
					suggestions.push(sug.substring(0,index));
				}
			}
		}
		return suggestions;
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

}
