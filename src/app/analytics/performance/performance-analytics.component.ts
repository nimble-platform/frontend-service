import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "../analytics.service";
import { CallStatus } from "../../common/call-status";
import { SimpleSearchService } from '../../simple-search/simple-search.service';
import { CategoryService } from '../../catalogue/category/category.service';
import * as myGlobals from '../../globals';
import {selectNameFromLabelObject} from '../../common/utils';
import { CookieService } from "ng2-cookies";
import {TranslateService} from '@ngx-translate/core';
import { DomSanitizer } from "@angular/platform-browser";

@Component({
    selector: "performance-analytics",
    templateUrl: "./performance-analytics.component.html",
    styleUrls: ["./performance-analytics.component.css"]
})
export class PerformanceAnalyticsComponent implements OnInit {
    user_count = -1;
    comp_count = -1;
    bp_count = -1;
    green_perc = 0;
    yellow_perc = 0;
    red_perc = 0;
    green_perc_str = "0%";
    yellow_perc_str = "0%";
    red_perc_str = "0%";
    cat_loading = true;
    cat_levels = [];
    cat_level = -2;
	cat = "";

	months = ["Jan", "Feb", "March", "April", "May", "June", "July","Aug","Sep","Oct","Nov","Dec"];

	greenTotalApproved = 0;
	yellowTotWaiting = 0;
	redTotDenide = 0;

	//seller bit
	green_percSeller = 0;
    yellow_percSeller = 0;
    red_percSeller = 0;
	green_perc_strSeller = "0%";
    yellow_perc_strSeller = "0%";
    red_perc_strSeller = "0%";
	greenTotalApprovedSeller = 0;
	yellowTotWaitingSeller = 0;
	redTotDenideSeller = 0;
	totSeller = 0;

	//buyer bit
	green_percBuyer = 0;
    yellow_percBuyer = 0;
    red_percBuyer = 0;
	green_perc_strBuyer = "0%";
    yellow_perc_strBuyer = "0%";
    red_perc_strBuyer = "0%";
	greenTotalApprovedBuyer = 0;
	yellowTotWaitingBuyer = 0;
	redTotDenideBuyer = 0;
	totBuyer = 0;

	// average trade
    trade_count = -1;
    trade_green = 0;
    trade_yellow = 0;
    trade_red = 0;
	trade_green_perc = 0;
    trade_yellow_perc = 0;
    trade_red_perc = 0;
    trade_green_perc_str = "0%";
    trade_yellow_perc_str = "0%";
	trade_red_perc_str = "0%";

	// average trade seller
    trade_count_sell = -1;
    trade_green_sell = 0;
    trade_yellow_sell = 0;
    trade_red_sell = 0;
	trade_green_perc_sell = 0;
    trade_yellow_perc_sell = 0;
    trade_red_perc_sell = 0;
    trade_green_perc_str_sell = "0%";
    trade_yellow_perc_str_sell = "0%";
	trade_red_perc_str_sell = "0%";

	// average trade buyer
    trade_count_buy = -1;
    trade_green_buy = 0;
    trade_yellow_buy = 0;
    trade_red_buy = 0;
	trade_green_perc_buy = 0;
    trade_yellow_perc_buy = 0;
    trade_red_perc_buy = 0;
    trade_green_perc_str_buy = "0%";
    trade_yellow_perc_str_buy = "0%";
	trade_red_perc_str_buy = "0%";

	// collab time
	collab_time = 0;
	collab_time_sell = 0;
	collab_time_buy = 0;

	avg_res_time = 0;

	single: any[];

	view: any[] = [700, 400];

	// options
	showXAxis = true;
	showYAxis = true;
	gradient = false;
	showLegend = false;
	showXAxisLabel = false;
	xAxisLabel = 'Month';
	showGridLines = true;
	showYAxisLabel = true;
	yAxisLabel = 'Average Response Time(s)';
	showChart = false;
	colorScheme = {
	  domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
	};
	// line, area
	autoScale = true;
	multi = [];

    product_count = 0;
    service_count = 0;
	loadedps = false;
	selectedTab = "Performance";
	comp_id = "";
    callStatus: CallStatus = new CallStatus();
	categoriesCallStatus: CallStatus = new CallStatus();
	callStatusCollab: CallStatus = new CallStatus();

    product_cat_mix = myGlobals.product_cat_mix;
	getMultilingualLabel = selectNameFromLabelObject;
	config = myGlobals.config;
	dashboards = [];
	graphsa = [];

    constructor(private analyticsService: AnalyticsService,
		private simpleSearchService: SimpleSearchService,
		private cookieService: CookieService,
		private categoryService: CategoryService,
		private translate: TranslateService,
		private sanitizer: DomSanitizer
        ) {
    	}

    ngOnInit(): void {
		this.selectedTab = "Performance";
		this.callStatus.submit();
		let compId = this.cookieService.get('company_id');
		this.comp_id = compId;
		Promise.resolve(this.getCatTree()).then( res => {
			this.analyticsService
            .getPerfromanceAnalytics(compId)
            .then(res => {
                this.callStatus.callback("Successfully loaded platform analytics", true);
                this.user_count = res.identity.totalUsers;
                this.comp_count = res.identity.totalCompanies;
                this.bp_count = Math.round(res.businessProcessCount.total);
                this.green_perc = Math.round((res.businessProcessCount.state.approved * 100) / this.bp_count);
                this.green_perc_str = this.green_perc + "%";
                this.yellow_perc = Math.round((res.businessProcessCount.state.waiting * 100) / this.bp_count);
                this.yellow_perc_str = this.yellow_perc + "%";
                this.red_perc = 100 - this.green_perc - this.yellow_perc;
				this.red_perc_str = this.red_perc + "%";
				this.greenTotalApproved = res.businessProcessCount.state.approved;
				this.yellowTotWaiting= res.businessProcessCount.state.waiting;
				this.redTotDenide = res.businessProcessCount.state.denied;
				//seller details
				this.greenTotalApprovedSeller = res.businessProcessCount.role.seller.approved;
				this.redTotDenideSeller = res.businessProcessCount.role.seller.denied;
				this.yellowTotWaitingSeller = res.businessProcessCount.role.seller.waiting;
				this.totSeller = res.businessProcessCount.role.seller.tot;
				this.green_percSeller = Math.round((res.businessProcessCount.role.seller.approved * 100) / this.totSeller);
                this.green_perc_strSeller = this.green_percSeller + "%";
                this.yellow_percSeller = Math.round((res.businessProcessCount.role.seller.waiting * 100) / this.totSeller);
                this.yellow_perc_strSeller = this.yellow_percSeller + "%";
                this.red_percSeller = 100 - this.green_percSeller - this.yellow_percSeller;
				this.red_perc_strSeller = this.red_percSeller + "%";

				//buyer details
				this.greenTotalApprovedBuyer = res.businessProcessCount.role.buyer.approved;
				this.redTotDenideBuyer = res.businessProcessCount.role.buyer.denied;
				this.yellowTotWaitingBuyer = res.businessProcessCount.role.buyer.waiting;
				this.totBuyer = res.businessProcessCount.role.buyer.tot;
				this.green_percBuyer = Math.round((res.businessProcessCount.role.buyer.approved * 100) / this.totBuyer);
                this.green_perc_strBuyer = this.green_percBuyer + "%";
                this.yellow_percBuyer = Math.round((res.businessProcessCount.role.buyer.waiting * 100) / this.totBuyer);
                this.yellow_perc_strBuyer = this.yellow_percBuyer + "%";
                this.red_percBuyer = 100 - this.green_percBuyer - this.yellow_percBuyer;
				this.red_perc_strBuyer = this.red_percBuyer + "%";
            })
            .catch(error => {
                this.callStatus.error("Error while loading platform analytics", error);
			});

			if (this.config.kibanaEnabled) {
				let tmpDashboards = this.config.kibanaConfig.companyDashboards;
				for (let i=0; i<tmpDashboards.length; i++) {
				  let tmpUrl=tmpDashboards[i].url;
				  tmpUrl=tmpUrl.replace(/'41915'/g,"'"+compId+"'");
				  let full_url = myGlobals.kibana_endpoint +tmpUrl;
				  tmpDashboards[i]["safeUrl"] = this.sanitizer.bypassSecurityTrustResourceUrl(full_url);
				}
				this.dashboards = tmpDashboards;

				let tmpGraphs = this.config.kibanaConfig.companyGraphs;
				for (let i=0; i<tmpGraphs.length; i++) {
					let tmpUrl=tmpGraphs[i].url;
					tmpUrl=tmpUrl.replace(/'41915'/g,"'"+compId+"'");
					let full_url = myGlobals.kibana_endpoint +tmpUrl;
					tmpGraphs[i]["safeUrl"] = this.sanitizer.bypassSecurityTrustResourceUrl(full_url);
				  }
				  this.graphsa = tmpGraphs;
			  }


		});

    }

    isLoading(): boolean {
        return this.callStatus.fb_submitted;
    }

	isCollabLoading(): boolean {
		return this.callStatusCollab.fb_submitted;
	}

    private getCatTree(): void {
		this.categoriesCallStatus.submit();

		this.simpleSearchService.getCompanyBasedProductsAndServices('manufacturerId:"'+this.comp_id+'"',[this.product_cat_mix],[""],1,"","")
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
                if(catele.preferredName.toLowerCase().indexOf("service") >= 0 || catele.preferredName.toLowerCase().indexOf("servicio") >= 0){
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

	getCollabStats(){
		this.callStatusCollab.submit();
		this.analyticsService
            .getCollabAnalytics(this.comp_id)
            .then(res => {
				this.callStatusCollab.callback("Successfully loaded collab analytics", true);
				// average trade seller
        		this.trade_green_sell = Math.round(res.tradingVolumesales.approved);
        		this.trade_yellow_sell = Math.round(res.tradingVolumesales.waiting);
        		this.trade_red_sell = Math.round(res.tradingVolumesales.denied);
				this.trade_count_sell = Math.round(res.tradingVolumesales.approved + res.tradingVolumesales.waiting + res.tradingVolumesales.denied);
				this.trade_green_perc_sell = Math.round((res.tradingVolumesales.approved * 100) / this.trade_count_sell);
				this.trade_green_perc_str_sell = this.trade_green_perc_sell + "%";
				this.trade_yellow_perc_sell = Math.round((res.tradingVolumesales.waiting * 100) / this.trade_count_sell);
				this.trade_yellow_perc_str_sell = this.trade_yellow_perc_sell + "%";
				this.trade_red_perc_sell = 100-this.trade_green_perc_sell - this.trade_yellow_perc_sell;
				this.trade_red_perc_str_sell = this.trade_red_perc_sell + "%";

				// average trade buyer
        		this.trade_green_buy = Math.round(res.tradingVolumespurchase.approved);
        		this.trade_yellow_buy = Math.round(res.tradingVolumespurchase.waiting);
        		this.trade_red_buy = Math.round(res.tradingVolumespurchase.denied);
				this.trade_count_buy = Math.round(res.tradingVolumespurchase.approved + res.tradingVolumespurchase.waiting + res.tradingVolumespurchase.denied);
				this.trade_green_perc_buy = Math.round((res.tradingVolumespurchase.approved * 100) / this.trade_count_buy);
				this.trade_green_perc_str_buy = this.trade_green_perc_buy + "%";
				this.trade_yellow_perc_buy = Math.round((res.tradingVolumespurchase.waiting * 100) / this.trade_count_buy);
				this.trade_yellow_perc_str_buy = this.trade_yellow_perc_buy + "%";
				this.trade_red_perc_buy = 100-this.trade_green_perc_buy - this.trade_yellow_perc_buy;
				this.trade_red_perc_str_buy = this.trade_red_perc_buy + "%";

				let totalTradingVolumeApproved = res.tradingVolumesales.approved + res.tradingVolumespurchase.approved;
				let totalTradingVolumeWaiting = res.tradingVolumesales.waiting + res.tradingVolumespurchase.waiting;
				let totalTradingVolumeDenied = res.tradingVolumesales.denied + res.tradingVolumesales.denied;
				this.trade_green = Math.round(totalTradingVolumeApproved);
				this.trade_yellow = Math.round(totalTradingVolumeWaiting);
				this.trade_red = Math.round(totalTradingVolumeDenied);
				this.trade_count = Math.round(totalTradingVolumeApproved + totalTradingVolumeWaiting + totalTradingVolumeDenied);
				this.trade_green_perc = Math.round((totalTradingVolumeApproved * 100) / this.trade_count);
				this.trade_green_perc_str = this.trade_green_perc + "%";
				this.trade_yellow_perc = Math.round((totalTradingVolumeWaiting * 100) / this.trade_count);
				this.trade_yellow_perc_str = this.trade_yellow_perc + "%";
				this.trade_red_perc = 100 - this.trade_green_perc - this.trade_yellow_perc;
				this.trade_red_perc_str = this.trade_red_perc + "%";

				//collab time
				this.collab_time = Math.round(res.collaborationTime.averageCollabTime * 10) /10 ;
				this.collab_time_buy = Math.round(res.collaborationTime.averageCollabTimePurchases * 10) /10;
				this.collab_time_sell = Math.round(res.collaborationTime.averageCollabTimeSales * 10) /10;

				this.avg_res_time = Math.round(res.responseTime.averageTime * 10) /10;

				var map1 = res.responseTime.averageTimeForMonths;
				var i = 0 ;
				var obj = [];


				for(var y = 0 ; y < 12 ; y++){
					if(map1[y] != undefined){
						obj.push({
							"value" : map1[y],
							"name" : this.months[y]
						})
					}
				}

				if(obj.length == 6){
					var dataGr =
						{
						  "name": "Time series",
						  "series":obj
						};

					this.multi.push(dataGr);
					this.showChart = true;

				}


			})
            .catch(error => {
                this.callStatusCollab.error("Error while loading platform analytics", error);
            });
	}



	onSelectTab(event: any, id: any): void {
		event.preventDefault();
		this.selectedTab = id;
		if(id == "Performance"){
		}else if( id == "Collaboration"){
			this.getCollabStats();
		}
	}
}
