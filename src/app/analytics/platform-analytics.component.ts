import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from "../common/call-status";
import { SimpleSearchService } from '../simple-search/simple-search.service';
import { CategoryService } from '../catalogue/category/category.service';
import * as myGlobals from '../globals';
import {selectNameFromLabelObject} from '../common/utils';

@Component({
    selector: "platform-analytics",
    templateUrl: "./platform-analytics.component.html",
    styleUrls: ["./platform-analytics.component.css"]
})
export class PlatformAnalyticsComponent implements OnInit {
    user_count = -1;
    comp_count = -1;
    bp_count = -1;
    trade_count = -1;
    green_perc = 0;
    yellow_perc = 0;
    red_perc = 0;
    green_perc_str = "0%";
    yellow_perc_str = "0%";
    red_perc_str = "0%";
    trade_green_perc = 0;
    trade_yellow_perc = 0;
    trade_red_perc = 0;
    trade_green_perc_str = "0%";
    trade_yellow_perc_str = "0%";
    trade_red_perc_str = "0%";
    cat_loading = true;
    cat_levels = [];    
    cat_level = -2;
	cat = "";    
    product_count = 0;
    service_count = 0;
    loadedps = false;

    callStatus: CallStatus = new CallStatus();
	categoriesCallStatus: CallStatus = new CallStatus();

    product_cat_mix = myGlobals.product_cat_mix;
	getMultilingualLabel = selectNameFromLabelObject;    
	config = myGlobals.config;

    constructor(private analyticsService: AnalyticsService,
        private simpleSearchService: SimpleSearchService,
		private categoryService: CategoryService,
        ) {

    }

    ngOnInit(): void {
        this.callStatus.submit();
        this.getCatTree();
        this.analyticsService
            .getPlatAnalytics()
            .then(res => {
                this.callStatus.callback("Successfully loaded platform analytics", true);
                this.user_count = res.identity.totalUsers;
                this.comp_count = res.identity.totalCompanies;
                this.bp_count = Math.round(res.businessProcessCount.state.approved + res.businessProcessCount.state.waiting + res.businessProcessCount.state.denied);
                this.green_perc = Math.round((res.businessProcessCount.state.approved * 100) / this.bp_count);
                this.green_perc_str = this.green_perc + "%";
                this.yellow_perc = Math.round((res.businessProcessCount.state.waiting * 100) / this.bp_count);
                this.yellow_perc_str = this.yellow_perc + "%";
                this.red_perc = 100 - this.green_perc - this.yellow_perc;
                this.red_perc_str = this.red_perc + "%";
                this.trade_count = Math.round(res.tradingVolume.approved + res.tradingVolume.waiting + res.tradingVolume.denied);
                this.trade_green_perc = Math.round((res.tradingVolume.approved * 100) / this.trade_count);
                this.trade_green_perc_str = this.trade_green_perc + "%";
                this.trade_yellow_perc = Math.round((res.tradingVolume.waiting * 100) / this.trade_count);
                this.trade_yellow_perc_str = this.trade_yellow_perc + "%";
                this.trade_red_perc = 100 - this.trade_green_perc - this.trade_yellow_perc;
                this.trade_red_perc_str = this.trade_red_perc + "%";
            })
            .catch(error => {
                this.callStatus.error("Error while loading platform analytics", error);
            });
    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

    private getCatTree(): void {
		this.categoriesCallStatus.submit();
		this.simpleSearchService.get("*",[this.product_cat_mix],[""],1,"","")
		.then(res => {
			// if res.facets are null, it means that there is no product in the index
			if (res.facets == null || Object.keys(res.facets).indexOf(this.product_cat_mix) == -1) {
				this.categoriesCallStatus.callback("Categories loaded.", true);
			} else {
				// before starting to build category tree, we have to get categories to retrieve their names
				this.buildCatTree(res.facets[this.product_cat_mix].entry);
				//this.categoriesCallStatus.callback("Categories loaded.", true);
			}
		})
		.catch(error => {
			this.categoriesCallStatus.error("Error while loading category tree.", error);
		});
    }
    

	private async buildCatTree(categoryCounts: any[]) {
		var taxonomy = "eClass";
		if (this.config.standardTaxonomy.localeCompare("All") != 0 && this.config.standardTaxonomy.localeCompare("eClass") != 0) {
			taxonomy = this.config.standardTaxonomy;
		}
		var taxonomyPrefix = "";
		if (this.config.categoryFilter[taxonomy] && this.config.categoryFilter[taxonomy].ontologyPrefix)
			taxonomyPrefix = this.config.categoryFilter[taxonomy].ontologyPrefix;

		// retrieve the labels for the category uris included in the categoryCounts field
		let categoryUris: string[] = [];
		for (let categoryCount of categoryCounts) {
			categoryUris.push(categoryCount.label);
		}
		this.cat_loading = true;
		var indexCategories = await this.categoryService.getCategories(categoryUris);
		let categoryDisplayInfo: any = this.getCategoryDisplayInfo(indexCategories);
		let split_idx:any = -1;
		let name:any = "";
		if (taxonomyPrefix != "") {
			// ToDo: Remove manual distinction after search update
			// ================================================================================
			if (taxonomy == "eClass") {
				this.cat_levels = [[],[],[],[]];
				for (let categoryCount of categoryCounts) {
					let facet_inner = categoryCount.label;
					var count = categoryCount.count;
					if (facet_inner.startsWith(taxonomyPrefix)) {
						var eclass_idx = categoryDisplayInfo[facet_inner].code;
						if (eclass_idx%1000000==0) {
							this.cat_levels[0].push({"name":facet_inner,"id":facet_inner,"count":count,"preferredName":selectNameFromLabelObject(categoryDisplayInfo[facet_inner].label)});
						}
					}
				}
			}
			// ================================================================================
			// if (this.cat == "") {
			else if (this.cat == "") {
				this.cat_levels = [];
				var lvl = [];

				for (let categoryCount of categoryCounts) {
					var count = categoryCount.count;
					var ontology = categoryCount.label;
					if (categoryDisplayInfo[ontology] != null && ontology.indexOf(taxonomyPrefix) != -1) {
						split_idx = ontology.lastIndexOf("#");
						name = ontology.substr(split_idx+1);
						if (categoryDisplayInfo[ontology].isRoot && this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(name) == -1){
							if(ontology.startsWith(taxonomyPrefix)){
								lvl.push({"name":ontology,"id":ontology,"count":count,"preferredName": selectNameFromLabelObject(categoryDisplayInfo[ontology].label)});
							}else{
								lvl.push({"name":ontology,"id":ontology,"count":count,"preferredName":ontology});
							}
						}
					}
				}
				this.cat_levels.push(lvl);
			}
			else {
				var catLevels = [];
				this.cat_levels = [];
				for (var i=0; i<catLevels.length; i++) {
					var lvl = [];
					var constructedLevel: string[] = catLevels[i];
					for(let uri of constructedLevel) {
						let categoryCount = categoryCounts.find(cat => cat.label == uri);
						if(categoryCount != null) {
							var count = categoryCount.count;
							var ontology = categoryCount.label;

							if (categoryDisplayInfo[uri] != null && uri.indexOf(taxonomyPrefix) != -1) {
								split_idx = uri.lastIndexOf("#");
								name = uri.substr(split_idx+1);
								if (this.config.categoryFilter[taxonomy].hiddenCategories.indexOf(name) == -1) {
									if (ontology.startsWith(taxonomyPrefix)) {
										lvl.push({"name": uri, "id": uri, "count": count, "preferredName": selectNameFromLabelObject(categoryDisplayInfo[uri].label)});
									} else {
										lvl.push({"name": uri, "id": uri, "count": count, "preferredName": name});
									}
								}
							}
						}
					}
					this.cat_levels.push(lvl);
				}
			}
        }
        
        this.cat_levels[0].forEach(catele => {
            if(catele.preferredName != null && catele.preferredName != ''){
                if(catele.preferredName.toLowerCase().indexOf("service") >= 0){
                    this.service_count = this.service_count+catele.count;
                }else{
                    this.product_count = this.product_count+catele.count;
                }
            }
        });

        this.loadedps = true;
        this.cat_loading = false;
        

        this.categoriesCallStatus.callback("Categories loaded.", true);
        

	}

    getCategoryDisplayInfo(categories: any): any {
		let labelMap = {};
		for(let category of categories.result) {
			labelMap[category.uri] = {};
			labelMap[category.uri].label = category.label;
			labelMap[category.uri].code = category.code;
			labelMap[category.uri].isRoot = category.allParents == null ? true : false;
		}
		return labelMap;
	}
}
