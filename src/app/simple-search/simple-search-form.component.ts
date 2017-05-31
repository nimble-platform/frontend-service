import { Component } from '@angular/core';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';
import * as myGlobals from '../globals';

@Component({
	selector: 'simple-search-form',
	templateUrl: './simple-search-form.component.html',
	styleUrls: ['./simple-search-form.component.css']
})

export class SimpleSearchFormComponent {

	product_name = myGlobals.product_name;
	product_vendor = myGlobals.product_vendor;
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
	model = new Search('');
	objToSubmit = new Search('');
	facetObj: any;
	facetQuery: any;
	response: any;

	constructor(
		private simpleSearchService: SimpleSearchService
	) {
	}
	
	get(search: Search): void {
		this.simpleSearchService.getFields()
		.then(res => {
			this.simpleSearchService.get(search.q,res._body.split(","),this.facetQuery,this.page)
			.then(res => {
				this.facetObj = [];
				var index = 0;
				for (let facet in res.facet_counts.facet_fields) {
					if (JSON.stringify(res.facet_counts.facet_fields[facet]) != "{}") {
						if (this.simpleSearchService.checkField(facet)) {
							this.facetObj.push({
								"name":facet,
								"options":[]
							});
							for (let facet_inner in res.facet_counts.facet_fields[facet]) {
								this.facetObj[index].options.push({
									"name":facet_inner,
									"count":res.facet_counts.facet_fields[facet][facet_inner]
								});
							}
							index++;
						}
					}
				}
				this.response = res.response.docs;
				this.size = res.response.numFound;
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
		this.callback = false;
		this.error_detc = false;
		this.objToSubmit = JSON.parse(JSON.stringify(this.model));
		this.submitted = true;
		this.facetQuery = [];
		this.get(this.objToSubmit);
	}
	
	setFacet(outer:string ,inner:string) {
		var fq = outer+":"+inner;
		if (this.facetQuery.indexOf(fq) == -1)
			this.facetQuery.push(fq);
		else
			this.facetQuery.splice(this.facetQuery.indexOf(fq), 1);
		this.get(this.objToSubmit);
	}

}