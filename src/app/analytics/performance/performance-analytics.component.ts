/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Component, OnInit } from "@angular/core";
import { AnalyticsService } from "../analytics.service";
import { CallStatus } from "../../common/call-status";
import { SimpleSearchService } from '../../simple-search/simple-search.service';
import { CategoryService } from '../../catalogue/category/category.service';
import * as myGlobals from '../../globals';
import {getTimeLabel, selectNameFromLabelObject, populateValueObjectForMonthGraphs} from '../../common/utils';
import { CookieService } from "ng2-cookies";
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from "@angular/platform-browser";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: "performance-analytics",
    templateUrl: "./performance-analytics.component.html",
    styleUrls: ["./performance-analytics.component.css"]
})
export class PerformanceAnalyticsComponent implements OnInit {
    hideVisitStats = myGlobals.config.hideVisitStats;
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
    collab_time = null;
    collab_time_sell = null;
    collab_time_buy = null;

    avg_res_time = null;

    single: any[];

    view: any[] = [700, 450];

    // options
    showXAxis = true;
    showYAxis = true;
    gradient = false;
    showLegend = false;
    showXAxisLabel = false;
    xAxisLabel = 'Month';
    showGridLines = true;
    showYAxisLabel = true;
    yAxisLabelForAverageResponseChart = this.translate.instant('Average Response Time(s) in days');
    yAxisLabelForAverageCollaborationTimeChart = this.translate.instant('Average Collaboration Time(s) in days');
    yAxisLabelForAverageCollaborationTimeSalesChart = this.translate.instant('Average Collaboration Time(s) In Sales in days');
    yAxisLabelForAverageCollaborationTimePurchaseChart = this.translate.instant('Average Collaboration Time(s) In Purchases in days');
    showAverageResponseChart = false;
    showAverageCollaborationTimeChart = false;
    showAverageCollaborationTimeSalesChart = false;
    showAverageCollaborationTimePurchaseChart = false;
    colorScheme = {
        domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
    };
    // line, area
    autoScale = true;
    multi = [];
    averageCollaborationTimeChartData = [];
    averageCollaborationTimeSalesChartData = [];
    averageCollaborationTimePurchaseChartData = [];

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

    tooltipHTML: string;

    constructor(private analyticsService: AnalyticsService,
        private simpleSearchService: SimpleSearchService,
        private cookieService: CookieService,
        private categoryService: CategoryService,
        private modalService: NgbModal,
        private translate: TranslateService,
        private sanitizer: DomSanitizer
    ) {
    }

    ngOnInit(): void {
        this.selectedTab = "Performance";
        this.callStatus.submit();
        let compId = this.cookieService.get('company_id');
        this.comp_id = compId;
        Promise.resolve(this.getCatTree()).then(res => {
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
                    this.yellowTotWaiting = res.businessProcessCount.state.waiting;
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
                for (let i = 0; i < tmpDashboards.length; i++) {
                    let tmpUrl = tmpDashboards[i].url;
                    tmpUrl = tmpUrl.replace(/'41915'/g, "'" + compId + "'");
                    let full_url = myGlobals.kibana_endpoint + tmpUrl;
                    tmpDashboards[i]["safeUrl"] = this.sanitizer.bypassSecurityTrustResourceUrl(full_url);
                }
                this.dashboards = tmpDashboards;

                let tmpGraphs = this.config.kibanaConfig.companyGraphs;
                for (let i = 0; i < tmpGraphs.length; i++) {
                    let tmpUrl = tmpGraphs[i].url;
                    tmpUrl = tmpUrl.replace(/'41915'/g, "'" + compId + "'");
                    let full_url = myGlobals.kibana_endpoint + tmpUrl;
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

        this.simpleSearchService.getCompanyBasedProductsAndServices('manufacturerId:"' + this.comp_id + '"', [this.product_cat_mix], [""], 1, "", "")
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
        // retrieve the labels for the category uris included in the categoryCounts field
        let categoryUris: string[] = [];
        for (let categoryCount of categoryCounts) {
            categoryUris.push(categoryCount.label);
        }
        this.cat_loading = true;
        var indexCategories = await this.categoryService.getCategories(categoryUris);
        let categoryDisplayInfo: any = this.getCategoryDisplayInfo(indexCategories);

        let rootCategories = [];
        categoryUris.forEach(categoryUri => {
            if(categoryDisplayInfo[categoryUri] && categoryDisplayInfo[categoryUri].isRoot){
                rootCategories.push(categoryUri);
            }
        })

        // set product and service counts
        this.product_count = 0;
        this.service_count = 0;
        rootCategories.forEach(rootCategoryUri => {
            if(this.categoryService.isServiceCategory(rootCategoryUri)){
                this.service_count += categoryCounts.find(categoryCount => categoryCount.label === rootCategoryUri).count;
            } else{
                this.product_count += categoryCounts.find(categoryCount => categoryCount.label === rootCategoryUri).count;
            }
        })

        this.loadedps = true;
        this.cat_loading = false;


        this.categoriesCallStatus.callback("Categories loaded.", true);


    }

    getCategoryDisplayInfo(categories: any): any {
        let labelMap = {};
        for (let category of categories.result) {
            labelMap[category.uri] = {};
            labelMap[category.uri].label = category.label;
            labelMap[category.uri].code = category.code;
            labelMap[category.uri].isRoot = category.allParents == null ? true : false;
        }
        return labelMap;
    }

    getCollabStats() {
        this.callStatusCollab.submit();
        this.analyticsService
            .getCollabAnalytics(this.comp_id)
            .then(res => {
                // average trade seller
                this.trade_green_sell = Math.round(res.tradingVolumesales.approved);
                this.trade_yellow_sell = Math.round(res.tradingVolumesales.waiting);
                this.trade_red_sell = Math.round(res.tradingVolumesales.denied);
                this.trade_count_sell = Math.round(res.tradingVolumesales.approved + res.tradingVolumesales.waiting + res.tradingVolumesales.denied);
                this.trade_green_perc_sell = Math.round((res.tradingVolumesales.approved * 100) / this.trade_count_sell);
                this.trade_green_perc_str_sell = this.trade_green_perc_sell + "%";
                this.trade_yellow_perc_sell = Math.round((res.tradingVolumesales.waiting * 100) / this.trade_count_sell);
                this.trade_yellow_perc_str_sell = this.trade_yellow_perc_sell + "%";
                this.trade_red_perc_sell = 100 - this.trade_green_perc_sell - this.trade_yellow_perc_sell;
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
                this.trade_red_perc_buy = 100 - this.trade_green_perc_buy - this.trade_yellow_perc_buy;
                this.trade_red_perc_str_buy = this.trade_red_perc_buy + "%";

                let totalTradingVolumeApproved = res.tradingVolumesales.approved + res.tradingVolumespurchase.approved;
                let totalTradingVolumeWaiting = res.tradingVolumesales.waiting + res.tradingVolumespurchase.waiting;
                let totalTradingVolumeDenied = res.tradingVolumesales.denied + res.tradingVolumespurchase.denied;
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
                this.collab_time = getTimeLabel(res.collaborationTime.averageCollabTime);
                this.collab_time_buy = getTimeLabel(res.collaborationTime.averageCollabTimePurchases);
                this.collab_time_sell = getTimeLabel(res.collaborationTime.averageCollabTimeSales);

                // average collaboration time chart
                let obj = populateValueObjectForMonthGraphs(res.collaborationTime.averageCollabTimeForMonths);
                if (obj.length == 6) {
                    var dataGr =
                        {
                            "name": "Time series",
                            "series": obj
                        };

                    this.averageCollaborationTimeChartData.push(dataGr);
                    this.showAverageCollaborationTimeChart = true;

                }

                // average collaboration time in sales chart
                obj = populateValueObjectForMonthGraphs(res.collaborationTime.averageCollabTimeSalesForMonths);
                if (obj.length == 6) {
                    var dataGr =
                        {
                            "name": "Time series",
                            "series": obj
                        };

                    this.averageCollaborationTimeSalesChartData.push(dataGr);
                    this.showAverageCollaborationTimeSalesChart = true;

                }

                // average collaboration time in purchase chart
                obj = populateValueObjectForMonthGraphs(res.collaborationTime.averageCollabTimePurchasesForMonths);
                if (obj.length == 6) {
                    var dataGr =
                        {
                            "name": "Time series",
                            "series": obj
                        };

                    this.averageCollaborationTimePurchaseChartData.push(dataGr);
                    this.showAverageCollaborationTimePurchaseChart = true;

                }

                // average response time

                this.avg_res_time = getTimeLabel(res.responseTime.averageTime);

                obj = populateValueObjectForMonthGraphs(res.responseTime.averageTimeForMonths);
                if (obj.length == 6) {
                    var dataGr =
                    {
                        "name": "Time series",
                        "series": obj
                    };

                    this.multi.push(dataGr);
                    this.showAverageResponseChart = true;

                }

                this.callStatusCollab.callback("Successfully loaded collab analytics", true);
            })
            .catch(error => {
                this.callStatusCollab.error("Error while loading platform analytics", error);
            });
    }

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
        if (id == "Performance") {
        } else if (id == "Collaboration") {
            this.getCollabStats();
        }
    }

    showToolTip(content,key) {
        this.tooltipHTML = this.translate.instant(key);
        this.modalService.open(content);
    }
}
