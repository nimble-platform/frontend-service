import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import * as myGlobals from '../globals';

@Injectable()
export class SimpleSearchService {

	private headers = new Headers({'Content-Type': 'application/json'});
	//private url = myGlobals.endpoint;
	private url = "http://134.168.33.237:8080/marmotta/solr/fredo/select";
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
		const url = `${this.url}?q=${query}&start=${start}&facet=true&sort=score%20desc&rows=10&facet.sort=count&facet.limit=10&facet.mincount=2&json.nl=map&wt=json`;
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
	
	private handleError(error: any): Promise<any> {
		return Promise.reject(error.message || error);
	}
	
}