import { Component } from '@angular/core';
import { Search } from './model/search';
import { SimpleSearchService } from './simple-search.service';

@Component({
	selector: 'simple-search-form',
	templateUrl: './simple-search-form.component.html',
	styleUrls: ['./simple-search-form.component.css']
})

export class SimpleSearchFormComponent {

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
						if (facet.indexOf("lmf.") == -1 && facet.indexOf("_d") == -1 && facet.indexOf("_s") == -1 && facet != "thumb") {
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