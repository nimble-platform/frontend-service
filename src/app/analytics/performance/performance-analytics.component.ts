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
import { Router } from '@angular/router';
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
import { BPEService } from '../../bpe/bpe.service';
import { BPDataService } from '../../bpe/bp-view/bp-data-service';
import { MonitorService, ProcessSummary } from '../../dashboard/monitor/monitor.service';
import { OVERDUE_DAYS_THRESHOLD } from '../../dashboard/constants';
import { FEDERATIONID } from '../../catalogue/model/constants';

/**
 * HCDP-05-03 F2 — single row in the Delivery Schedule subsection.
 * Composed from BPE /monitor/process-summary/{pid} responses across all PIDs in
 * each collaboration group, classified into 4 mutually-exclusive statuses.
 */
interface DeliveryScheduleRow {
    pid: string;
    federationId: string;
    side: 'BUYER' | 'SELLER';
    status: 'PLANNED' | 'IN_TRANSIT' | 'OVERDUE' | 'DELIVERED';
    productLabel: string;
    partner: string;
    submissionDate: string | null;
    deadline: string | null;
    daysToDeadline: number | null;
}

type DeliveryTimeRange = 'NEXT_7' | 'NEXT_30' | 'NEXT_90' | 'ALL';
type DeliveryStatusFilter = 'ALL' | 'PLANNED' | 'IN_TRANSIT' | 'OVERDUE' | 'DELIVERED';

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

    // ---- Processing Operations tab (HCDP-04-01) ----
    callStatusProcessing: CallStatus = new CallStatus();

    // Section 1: Process Type Distribution (doughnut)
    processTypePieData: any[] = [];
    processTypeCustomColors: any[] = [
        { name: 'Negotiation',  value: '#2e7d32' },
        { name: 'Order',        value: '#1565c0' },
        { name: 'Fulfilment',   value: '#f9a825' },
        { name: 'Transport',    value: '#6a1b9a' },
        { name: 'Info Request', value: '#e65100' }
    ];
    processTypeTotalCount = 0;

    // Section 2: Order & Fulfilment completion rates
    orderTotal = 0; orderApproved = 0; orderWaiting = 0; orderDenied = 0;
    orderCompletionRate = '0%';
    orderApprovedPercStr = '0%'; orderWaitingPercStr = '0%'; orderDeniedPercStr = '0%';

    fulfilmentTotal = 0; fulfilmentApproved = 0; fulfilmentWaiting = 0; fulfilmentDenied = 0;
    fulfilmentRate = '0%';
    fulfilmentApprovedPercStr = '0%'; fulfilmentWaitingPercStr = '0%'; fulfilmentDeniedPercStr = '0%';

    // Section 3: Non-ordered products
    nonOrderedProducts: any = null;    // null = not loaded yet
    nonOrderedCount = 0;
    nonOrderedProductNames: string[] = [];

    // ---- Section 2.5: HCDP-05-03 Delivery Schedule subsection ----
    callStatusDeliverySchedule: CallStatus = new CallStatus();
    deliverySchedule: DeliveryScheduleRow[] = [];   // raw rows (cross-side, all statuses)
    effectiveRows: DeliveryScheduleRow[] = [];      // filter-applied subset (drives table + counts)
    deliveryCounts = { planned: 0, inTransit: 0, overdue: 0, delivered: 0 };
    selectedTimeRange: DeliveryTimeRange = 'NEXT_30';
    selectedStatus: DeliveryStatusFilter = 'ALL';
    deliveryScheduleLoaded = false;

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
        private sanitizer: DomSanitizer,
        private bpeService: BPEService,
        private monitorService: MonitorService,
        private bpDataService: BPDataService,
        private router: Router
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

    isProcessingLoading(): boolean {
        return this.callStatusProcessing.fb_submitted;
    }

    getColorForProcessType(name: string): string {
        const match = this.processTypeCustomColors.find(c => c.name === name);
        return match ? match.value : '#AAAAAA';
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

    getProcessingStats() {
        this.callStatusProcessing.submit();
        Promise.all([
            this.analyticsService.getProcessingAnalytics(this.comp_id),
            this.analyticsService.getNonOrdered(this.comp_id).catch(() => ({ companies: {} }))
        ]).then(([proc, nonOrdered]) => {
            // --- Section 1: Process Type Distribution ---
            const pc = proc.processTypeCounts;
            this.processTypePieData = [
                { name: 'Negotiation',  value: pc.NEGOTIATION },
                { name: 'Order',        value: pc.ORDER },
                { name: 'Fulfilment',   value: pc.FULFILMENT },
                { name: 'Transport',    value: pc.TRANSPORT_EXECUTION_PLAN },
                { name: 'Info Request', value: pc.ITEM_INFORMATION_REQUEST }
            ].filter(d => d.value > 0);
            this.processTypeTotalCount = (pc.NEGOTIATION || 0) + (pc.ORDER || 0)
                + (pc.FULFILMENT || 0) + (pc.TRANSPORT_EXECUTION_PLAN || 0)
                + (pc.ITEM_INFORMATION_REQUEST || 0);

            // --- Section 2: Order completion rate ---
            const o = proc.orderStatus;
            this.orderApproved = o.approved;
            this.orderWaiting  = o.waiting;
            this.orderDenied   = o.denied;
            this.orderTotal    = o.total;
            if (this.orderTotal > 0) {
                const a = Math.round(o.approved * 100 / o.total);
                const w = Math.round(o.waiting  * 100 / o.total);
                this.orderApprovedPercStr = a + '%';
                this.orderWaitingPercStr  = w + '%';
                this.orderDeniedPercStr   = (100 - a - w) + '%';
                this.orderCompletionRate  = a + '%';
            } else {
                this.orderApprovedPercStr = '0%';
                this.orderWaitingPercStr  = '0%';
                this.orderDeniedPercStr   = '0%';
                this.orderCompletionRate  = '0%';
            }

            // --- Section 2: Fulfilment completion rate ---
            const f = proc.fulfilmentStatus;
            this.fulfilmentApproved = f.approved;
            this.fulfilmentWaiting  = f.waiting;
            this.fulfilmentDenied   = f.denied;
            this.fulfilmentTotal    = f.total;
            if (this.fulfilmentTotal > 0) {
                const a = Math.round(f.approved * 100 / f.total);
                const w = Math.round(f.waiting  * 100 / f.total);
                this.fulfilmentApprovedPercStr = a + '%';
                this.fulfilmentWaitingPercStr  = w + '%';
                this.fulfilmentDeniedPercStr   = (100 - a - w) + '%';
                this.fulfilmentRate            = a + '%';
            } else {
                this.fulfilmentApprovedPercStr = '0%';
                this.fulfilmentWaitingPercStr  = '0%';
                this.fulfilmentDeniedPercStr   = '0%';
                this.fulfilmentRate            = '0%';
            }

            // --- Section 3: Non-Ordered Products ---
            const companies = (nonOrdered && nonOrdered.companies) || {};
            const firstKey  = Object.keys(companies)[0];
            const products  = firstKey ? (companies[firstKey].products || []) : [];
            this.nonOrderedProducts     = nonOrdered || {};
            this.nonOrderedCount        = products.length;
            this.nonOrderedProductNames = products
                .map((p: any) => (p && p.name && p.name[0] && p.name[0].value)
                    || (p && p.manufacturersItemIdentification && p.manufacturersItemIdentification.id)
                    || 'Unknown')
                .slice(0, 10);

            this.callStatusProcessing.callback('Successfully loaded processing analytics', true);
        }).catch(error => {
            this.callStatusProcessing.error('Error while loading processing analytics', error);
        });
    }

    onSelectTab(event: any, id: any): void {
        event.preventDefault();
        this.selectedTab = id;
        if (id == "Performance") {
        } else if (id == "Collaboration") {
            this.getCollabStats();
        } else if (id == "Processing") {
            // Load once, then cache
            if (this.processTypeTotalCount === 0 && this.nonOrderedProducts === null) {
                this.getProcessingStats();
            }
            // HCDP-05-03 — Delivery Schedule subsection loads independently
            // (different data source: collaboration-groups + per-PID process-summary).
            if (!this.deliveryScheduleLoaded) {
                this.loadDeliverySchedule();
            }
        }
    }

    showToolTip(content,key) {
        this.tooltipHTML = this.translate.instant(key);
        this.modalService.open(content);
    }

    // ======================================================================
    // HCDP-05-03 — Delivery Schedule subsection
    // ======================================================================

    isDeliveryScheduleLoading(): boolean {
        return this.callStatusDeliverySchedule.fb_submitted;
    }

    /**
     * Loads cross-side (Sales + Purchases) collaboration groups for the current
     * company, classifies the latest PID of each PIG into one of 4 mutually
     * exclusive statuses (Planned / In Transit / Overdue / Delivered) and seeds
     * the schedule grid. Idempotent — `deliveryScheduleLoaded` flag suppresses
     * redundant fetches when the user re-enters the Processing tab.
     */
    loadDeliverySchedule(): void {
        this.callStatusDeliverySchedule.submit();
        const partyId = this.comp_id;
        const fedId = FEDERATIONID();

        // CollaborationRole is a strict "BUYER" | "SELLER" union — fire two parallel
        // calls and merge. Page size 100 covers typical company in-flight footprints
        // for the demo platform.
        const buyerPromise = this.bpeService.getCollaborationGroups(
            partyId, fedId, 'BUYER', 0, 100, false, [], [], [], ['STARTED', 'COMPLETED']);
        const sellerPromise = this.bpeService.getCollaborationGroups(
            partyId, fedId, 'SELLER', 0, 100, false, [], [], [], ['STARTED', 'COMPLETED']);

        Promise.all([buyerPromise, sellerPromise])
            .then(([buyerResp, sellerResp]) => {
                const candidates: { pid: string; federationId: string; side: 'BUYER' | 'SELLER'; partyName: string }[] = [];
                this.collectScheduleCandidates(buyerResp, 'BUYER', fedId, candidates);
                this.collectScheduleCandidates(sellerResp, 'SELLER', fedId, candidates);

                // Fetch summaries in parallel, tolerate per-row failures.
                return Promise.all(
                    candidates.map(c => this.monitorService.getProcessSummary(c.pid)
                        .then(summary => ({ candidate: c, summary }))
                        .catch(() => ({ candidate: c, summary: null as ProcessSummary | null })))
                );
            })
            .then(results => {
                const rows: DeliveryScheduleRow[] = [];
                results.forEach(r => {
                    const row = this.classifyDeliveryRow(r.candidate, r.summary);
                    if (row) rows.push(row);
                });
                this.deliverySchedule = rows;
                this.deliveryScheduleLoaded = true;
                this.applyDeliveryFilters();
                this.callStatusDeliverySchedule.callback('Loaded', true);
            })
            .catch(err => {
                this.callStatusDeliverySchedule.error('Failed to load delivery schedule', err);
            });
    }

    private collectScheduleCandidates(resp: any, side: 'BUYER' | 'SELLER', fedId: string,
                                      out: { pid: string; federationId: string; side: 'BUYER' | 'SELLER'; partyName: string }[]): void {
        const groups = (resp && (resp.collaborationGroups || resp)) || [];
        for (const cg of groups) {
            const pigs = (cg && cg.associatedProcessInstanceGroups) || [];
            for (const pig of pigs) {
                if (!pig.processInstanceIDs || pig.processInstanceIDs.length === 0) continue;
                // Latest PID's type tells us the current stage; the deadline lookup
                // (HCDP-05-03 F1) walks the whole PIG to find the upstream ORDER doc,
                // so a single process-summary call returns both stage + deadline.
                const pid = pig.processInstanceIDs[pig.processInstanceIDs.length - 1];
                out.push({
                    pid,
                    federationId: pig.federationID || fedId,
                    side,
                    partyName: pig.name || cg.name || ''
                });
            }
        }
    }

    /** Classify a process summary into one of 4 delivery statuses. Returns null when
     *  the PIG hasn't progressed to an order yet (RFQ-only / Quotation-only). */
    private classifyDeliveryRow(
        candidate: { pid: string; federationId: string; side: 'BUYER' | 'SELLER'; partyName: string },
        summary: ProcessSummary | null): DeliveryScheduleRow | null {

        if (!summary || !summary.type) return null;
        const type = summary.type.toUpperCase();
        const productLabel = (summary.products && summary.products[0]) || candidate.partyName || candidate.pid;
        const partner = summary.partner || '—';
        const submissionDate = summary.submissionDate || null;
        const deadline = summary.deadline || null;
        const daysToDeadline = this.computeDaysToDeadline(deadline);
        const daysSinceDispatch = this.computeDaysSince(submissionDate);

        let status: 'PLANNED' | 'IN_TRANSIT' | 'OVERDUE' | 'DELIVERED' | null = null;
        if (type === 'DESPATCHADVICE') {
            if (summary.hasReceiptAdvice) {
                status = 'DELIVERED';
            } else {
                // Prefer the explicit deadline when known: OVERDUE iff past deadline.
                // Fall back to the days-since-dispatch threshold ONLY when no deadline
                // is known — a dispatch shipped 6 days ago whose deadline is still
                // 5 days in the future is NOT overdue.
                const isOverdue = daysToDeadline !== null
                    ? daysToDeadline < 0
                    : (daysSinceDispatch !== null && daysSinceDispatch > OVERDUE_DAYS_THRESHOLD);
                status = isOverdue ? 'OVERDUE' : 'IN_TRANSIT';
            }
        } else if (type === 'ORDER' || type === 'ORDERRESPONSESIMPLE') {
            status = 'PLANNED';
        } else if (type === 'RECEIPTADVICE') {
            status = 'DELIVERED';
        } else {
            // RFQ / QUOTATION / TEP / ITEM_INFORMATION_REQUEST — pre-order, not a delivery.
            return null;
        }

        return {
            pid: candidate.pid,
            federationId: candidate.federationId,
            side: candidate.side,
            status,
            productLabel,
            partner,
            submissionDate,
            deadline,
            daysToDeadline
        };
    }

    private computeDaysSince(iso: string | null): number | null {
        if (!iso) return null;
        const t = new Date(iso).getTime();
        if (isNaN(t)) return null;
        return Math.floor((Date.now() - t) / (24 * 3600 * 1000));
    }

    private computeDaysToDeadline(iso: string | null): number | null {
        if (!iso) return null;
        const t = new Date(iso).getTime();
        if (isNaN(t)) return null;
        // Compare at day granularity to avoid hour-of-day off-by-one.
        const deadlineDay = new Date(t); deadlineDay.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return Math.round((deadlineDay.getTime() - today.getTime()) / (24 * 3600 * 1000));
    }

    /**
     * Re-derive `effectiveRows` and `deliveryCounts` from the cached
     * `deliverySchedule` by applying the active filters. Called on every filter
     * change and once after `loadDeliverySchedule` populates the raw list.
     */
    applyDeliveryFilters(): void {
        const effective = this.deliverySchedule.filter(row =>
            this.matchesTimeRange(row) && this.matchesStatus(row));
        this.effectiveRows = effective;

        // Counts always reflect the filtered set so the tiles stay consistent
        // with what the table shows. Overdue rows are kept regardless of the
        // time-range filter (see matchesTimeRange) so MD never loses sight of
        // them when narrowing the window.
        this.deliveryCounts = {
            planned:   effective.filter(r => r.status === 'PLANNED').length,
            inTransit: effective.filter(r => r.status === 'IN_TRANSIT').length,
            overdue:   effective.filter(r => r.status === 'OVERDUE').length,
            delivered: effective.filter(r => r.status === 'DELIVERED').length
        };
    }

    private matchesStatus(row: DeliveryScheduleRow): boolean {
        if (this.selectedStatus === 'ALL') return true;
        return row.status === this.selectedStatus;
    }

    private matchesTimeRange(row: DeliveryScheduleRow): boolean {
        if (this.selectedTimeRange === 'ALL') return true;
        // Overdue rows always shown — MD must never lose sight of them when
        // narrowing to a future window.
        if (row.status === 'OVERDUE') return true;
        // When user explicitly filters by a single status, time-range no longer
        // gates that status — they want to see all rows of that status. Without
        // this, e.g. selecting "DELIVERED" with "NEXT_30" filter would always
        // return zero (delivered rows have past deadlines).
        if (this.selectedStatus !== 'ALL' && this.selectedStatus === row.status) return true;
        // PLANNED / IN_TRANSIT in default filter mode: gate by deadline window.
        if (row.daysToDeadline === null) return false;
        if (row.daysToDeadline < 0) return false;
        const limit = this.selectedTimeRange === 'NEXT_7' ? 7
            : this.selectedTimeRange === 'NEXT_30' ? 30
            : 90;
        return row.daysToDeadline <= limit;
    }

    onTimeRangeChange(r: DeliveryTimeRange): void {
        this.selectedTimeRange = r;
        this.applyDeliveryFilters();
    }

    onStatusChange(s: DeliveryStatusFilter): void {
        this.selectedStatus = s;
        this.applyDeliveryFilters();
    }

    /** Top 10 rows of `effectiveRows` sorted by deadline ASC (soonest first).
     *  Rows without a deadline sink to the bottom but are still listed. */
    topNRows(): DeliveryScheduleRow[] {
        const sorted = this.effectiveRows.slice().sort((a, b) => {
            if (a.deadline === null && b.deadline === null) return 0;
            if (a.deadline === null) return 1;
            if (b.deadline === null) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        return sorted.slice(0, 10);
    }

    countdownBadgeClass(days: number | null): string {
        if (days === null) return 'badge-light';
        if (days < 0) return 'badge-danger';
        if (days <= 3) return 'badge-warning';
        return 'badge-light';
    }

    countdownLabel(days: number | null): string {
        if (days === null) return '';
        if (days < 0) return Math.abs(days) + ' days overdue';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return 'in ' + days + ' days';
    }

    statusBadgeClass(status: string): string {
        if (status === 'PLANNED') return 'badge-info';
        if (status === 'IN_TRANSIT') return 'badge-warning';
        if (status === 'OVERDUE') return 'badge-danger';
        if (status === 'DELIVERED') return 'badge-success';
        return 'badge-secondary';
    }

    timeRangeLabel(r: DeliveryTimeRange): string {
        if (r === 'NEXT_7') return 'Next 7 days';
        if (r === 'NEXT_30') return 'Next 30 days';
        if (r === 'NEXT_90') return 'Next 90 days';
        return 'All';
    }

    statusLabel(s: DeliveryStatusFilter): string {
        if (s === 'ALL') return 'All';
        if (s === 'PLANNED') return 'Planned';
        if (s === 'IN_TRANSIT') return 'In Transit';
        if (s === 'OVERDUE') return 'Overdue';
        return 'Delivered';
    }

    /**
     * HCDP-05-03 F5 — KPI tile click. Routes to the existing operational surface
     * that's most relevant to the tile's status. UX hint per the UC business rule
     * "only aggregated views unless further authorisation is granted" — clicking
     * counts as the "further authorisation" gesture.
     */
    drillDown(status: 'PLANNED' | 'IN_TRANSIT' | 'OVERDUE' | 'DELIVERED'): void {
        const tabMap: { [k: string]: string } = {
            PLANNED: 'UNSHIPPED_ORDERS',
            IN_TRANSIT: 'PENDING_RECEIPTS',
            OVERDUE: 'MONITOR',
            DELIVERED: 'PURCHASES'
        };
        this.router.navigate(['/dashboard'], { queryParams: { tab: tabMap[status] } });
    }

    /** Mini-table row click — drill into the per-order Fulfilment view via the
     *  same code path that powers Pending Receipts' "Confirm Reception" button. */
    viewDeliveryDetails(row: DeliveryScheduleRow): void {
        this.bpDataService.viewProcessDetails(row.pid, row.federationId);
    }
}
