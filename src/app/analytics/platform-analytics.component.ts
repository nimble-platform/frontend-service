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

import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { AnalyticsService } from "./analytics.service";
import { CallStatus } from "../common/call-status";
import { SimpleSearchService } from '../simple-search/simple-search.service';
import { CategoryService } from '../catalogue/category/category.service';
import * as myGlobals from '../globals';
import {getTimeLabel, selectNameFromLabelObject, populateValueObjectForMonthGraphs} from '../common/utils';
import { DomSanitizer } from "@angular/platform-browser";
import { UserService } from "../user-mgmt/user.service";
import { TranslateService } from '@ngx-translate/core';
import {BusinessProcessCountModalComponent} from './modal/business-process-count-modal.component';

@Component({
    selector: "platform-analytics",
    templateUrl: "./platform-analytics.component.html",
    styleUrls: ["./platform-analytics.component.css"]
})
export class PlatformAnalyticsComponent implements OnInit {
    hideLogAnalytics = myGlobals.config.hideLogAnalytics;
    user_count = -1;
    comp_count = -1;
    bp_count = -1;
    trade_count = -1;
    green = 0;
    yellow = 0;
    red = 0;
    green_perc = 0;
    yellow_perc = 0;
    red_perc = 0;
    green_perc_str = "0%";
    yellow_perc_str = "0%";
    red_perc_str = "0%";
    trade_green = 0;
    trade_yellow = 0;
    trade_red = 0;
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
    showBusinessProcessBreakdownForPlatformAnalytics = myGlobals.config.showBusinessProcessBreakdownForPlatformAnalytics
    getMultilingualLabel = selectNameFromLabelObject;
    config = myGlobals.config;
    dashboards = [];
    selectedTab;

    view: any[] = [700, 450];
    // collab time
    collab_time = null;
    collab_time_sell = null;
    collab_time_buy = null;
    avg_res_time = null;

    // options
    showXAxis = true;
    showYAxis = true;
    gradient = false;
    showLegend = false;
    showXAxisLabel = false;
    xAxisLabel = 'Month';
    showGridLines = true;
    showYAxisLabel = true;
    yAxisLabel = this.translate.instant('Average Response Time(s) in days');
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

    months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];


    // process count modal
    @ViewChild(BusinessProcessCountModalComponent)
    public processCountModal: BusinessProcessCountModalComponent;

    public secureSrc = "";

    @ViewChild('iframe') iframe: ElementRef;
    constructor(private analyticsService: AnalyticsService,
        private simpleSearchService: SimpleSearchService,
        private categoryService: CategoryService,
        private userService: UserService,
        private sanitizer: DomSanitizer,
        private translate: TranslateService,
    ) {
    }

    ngOnInit(): void {

        this.selectedTab = this.config.kibanaEnabled && !this.hideLogAnalytics? "LOG" : "DB";
        if (this.config.kibanaEnabled && !this.hideLogAnalytics) {
            let tmpDashboards = this.config.kibanaConfig.dashboards;
            for (let i = 0; i < tmpDashboards.length; i++) {
                let full_url = myGlobals.kibana_endpoint + tmpDashboards[i].url;
                tmpDashboards[i]["safeUrl"] = this.sanitizer.bypassSecurityTrustResourceUrl(full_url);
            }
            this.dashboards = tmpDashboards;
        }
        this.callStatus.submit();
        this.getCatTree();
        this.analyticsService
            .getPlatAnalytics()
            .then(res => {
                this.user_count = res.identity.totalUsers;
                this.comp_count = res.identity.totalCompanies;
                this.bp_count = Math.round(res.businessProcessCount.state.approved + res.businessProcessCount.state.waiting + res.businessProcessCount.state.denied);
                this.green = res.businessProcessCount.state.approved;
                this.yellow = res.businessProcessCount.state.waiting;
                this.red = res.businessProcessCount.state.denied;
                this.green_perc = Math.round((res.businessProcessCount.state.approved * 100) / this.bp_count);
                this.green_perc_str = this.green_perc + "%";
                this.yellow_perc = Math.round((res.businessProcessCount.state.waiting * 100) / this.bp_count);
                this.yellow_perc_str = this.yellow_perc + "%";
                this.red_perc = 100 - this.green_perc - this.yellow_perc;
                this.red_perc_str = this.red_perc + "%";
                this.trade_count = Math.round(res.tradingVolume.approved + res.tradingVolume.waiting + res.tradingVolume.denied);
                this.trade_green = Math.round(res.tradingVolume.approved);
                this.trade_yellow = Math.round(res.tradingVolume.waiting);
                this.trade_red = Math.round(res.tradingVolume.denied);
                this.trade_green_perc = Math.round((res.tradingVolume.approved * 100) / this.trade_count);
                this.trade_green_perc_str = this.trade_green_perc + "%";
                this.trade_yellow_perc = Math.round((res.tradingVolume.waiting * 100) / this.trade_count);
                this.trade_yellow_perc_str = this.trade_yellow_perc + "%";
                this.trade_red_perc = 100 - this.trade_green_perc - this.trade_yellow_perc;
                this.trade_red_perc_str = this.trade_red_perc + "%";

                this.analyticsService.getPlatCollabAnalytics()
                    .then(res => {
                        this.callStatus.callback("Successfully loaded platform analytics", true);
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


                    }).catch(error => {
                        this.callStatus.error("Error while loading platform analytics", error);
                    });

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
        this.simpleSearchService.get("*", [this.product_cat_mix], [""], 1, 1, "score desc", "", "", myGlobals.config.defaultSearchIndex)
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

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
    }

    /**
     * Opens the process count modal
     * */
    openProcessCountModal() {
        this.processCountModal.open();
    }
}
