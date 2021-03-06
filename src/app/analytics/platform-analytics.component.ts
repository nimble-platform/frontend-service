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
import {getTimeLabel, populateValueObjectForMonthGraphs} from '../common/utils';
import { DomSanitizer } from "@angular/platform-browser";
import { UserService } from "../user-mgmt/user.service";
import { TranslateService } from '@ngx-translate/core';
import {BusinessProcessCountModalComponent} from './modal/business-process-count-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: "platform-analytics",
    templateUrl: "./platform-analytics.component.html",
    styleUrls: ["./platform-analytics.component.css"]
})
export class PlatformAnalyticsComponent implements OnInit {
    hideLogAnalytics = myGlobals.config.hideLogAnalytics;
    user_count = -1;
    // keeps the number of registered companies
    registered_company_count = -1;
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
    cat_levels = [];
    cat = "";
    product_count = 0;
    service_count = 0;
    loadedps = false;

    callStatus: CallStatus = new CallStatus();
    categoriesCallStatus: CallStatus = new CallStatus();
    companyCallStatus:CallStatus = new CallStatus();

    product_cat_mix = myGlobals.product_cat_mix;
    showBusinessProcessBreakdownForPlatformAnalytics = myGlobals.config.showBusinessProcessBreakdownForPlatformAnalytics
    config = myGlobals.config;
    dashboards = [];
    selectedTab;

    tooltipHTML: string;
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
        private modalService: NgbModal,
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
        this.getProductAndServiceCounts();
        // get registered company count
        this.getRegisteredCompanyCount();
        this.analyticsService
            .getPlatAnalytics()
            .then(res => {
                this.user_count = res.identity.totalUsers;
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

    /**
     * Sets registered company count i.e. {@link registered_company_count}
     * */
    private getRegisteredCompanyCount(){
        this.simpleSearchService.getComp("*", [], [], null, null, "lowercaseLegalName asc","Name", null,false, true)
            .then(res => {
                this.registered_company_count = res.totalElements;
                this.companyCallStatus.callback("Successfully loaded companies", true);
            })
            .catch(error => {
                this.companyCallStatus.error("Error while loading companies", error);
            });
    }

    /**
     * Sets the product and service counts i.e. {@link product_count} and {@link service_count}
     * */
    private getProductAndServiceCounts(): void {
        // first get the categories to get the number of services
        this.categoryService.getServiceCategoriesForAvailableTaxonomies().then(res => {

            // catalogue count
            const catalogPromise: Promise<any> = this.simpleSearchService.get(
                '*',
                ['catalogueId'],
                [],
                1,
                0,
                'score desc',
                '',
                '',
                'Prod');

            const facetQuery: string[] = [];
            for (let cat of res) {
                facetQuery.push(`-commodityClassficationUri:\"${cat}\"`);
            }
            const servicePromise: Promise<any> = this.simpleSearchService.get(
                '*',
                [],
                facetQuery,
                1,
                0,
                'score desc',
                '',
                '',
                'Prod');

            Promise.all([catalogPromise, servicePromise]).then(([catalogResult, notServiceResult]) => {
                const totalItemCount: number = catalogResult.totalElements;
                this.product_count = notServiceResult.totalElements;
                this.service_count = totalItemCount - this.product_count;

                this.loadedps = true;
            });
        });
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

    showToolTip(content,key) {
        this.tooltipHTML = this.translate.instant(key);
        this.modalService.open(content);
    }
}
