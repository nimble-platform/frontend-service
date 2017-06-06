import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';

@Injectable()
export class SimpleSearchService {

	private headers = new Headers({'Content-Type': 'application/json'});
	private url = myGlobals.marmotta_endpoint;
	
	product_name = myGlobals.product_name;
	product_vendor_id = myGlobals.product_vendor_id;
	product_vendor_name = myGlobals.product_vendor_name;
	product_img = myGlobals.product_img;
	product_nonfilter_full = myGlobals.product_nonfilter_full;
	product_nonfilter_regex = myGlobals.product_nonfilter_regex;
	product_configurable = myGlobals.product_configurable;
	
	constructor(private http: Http) { }

	getFields(): Promise<any> {
		const url = `${this.url}?q=*:*&rows=0&wt=csv`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res)
		.catch(this.handleError);
	}
	
	get(query: string, facets: [string], facetQueries: [string], page: number): Promise<any> {
		var start = page*10-10;
		const url = `${this.url}?q=${query}&start=${start}&facet=true&sort=score%20desc&rows=10&facet.sort=count&facet.limit=10&facet.mincount=1&json.nl=map&wt=json`;
		var full_url = url + "";
		for (let facet of facets) {
			full_url += "&facet.field="+facet;
		}
		for (let facetQuery of facetQueries) {
			full_url += "&fq="+encodeURIComponent(facetQuery);
		}
		return this.http
		.get(full_url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	getSingle(id: string): Promise<any> {
		const url = `${this.url}?q=*&rows=1&wt=json&fq=id:${id}`;
		return this.http
		.get(url, {headers: this.headers})
		.toPromise()
		.then(res => res.json())
		.catch(this.handleError);
	}
	
	checkField(field:string): boolean {
		var valid = true;
		if (field == this.product_name || field == this.product_img || field == this.product_vendor_id)
			valid = false;
		for (let filter of this.product_nonfilter_full) {
			if (field == filter)
				valid = false;
		}
		for (let filter of this.product_nonfilter_regex) {
			if (field.search(filter) != -1)
				valid = false;
		}
		for (let filter of this.product_configurable) {
			if (field.search(filter) != -1)
				valid = false;
		}
		return valid;
	}
	
	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}
	
}