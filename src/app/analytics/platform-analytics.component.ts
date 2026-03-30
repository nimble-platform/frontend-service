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

    // New KPI metrics
    activeCompanyCount = 0;
    recentActivity30 = -1;

    get avgProductsPerCompany(): string {
        if (this.registered_company_count <= 0 || this.product_count < 0) return '???';
        return (this.product_count / this.registered_company_count).toFixed(1);
    }

    get negotiationSuccessRate(): string {
        if (this.bp_count <= 0) return '—';
        return this.green_perc + '%';
    }

    // --- New analytics charts ---
    // Country distribution
    countryChartData: any[] = [];
    loadedCountry = false;

    // Category distribution
    categoryChartData: any[] = [];
    loadedCategory = false;

    // Top active companies
    topCompaniesData: any[] = [];
    loadedTopCompanies = false;

    // BP success rate pie
    bpPieData: any[] = [];

    // Chart settings for new charts
    barColorScheme = {domain: ['#2e7d32', '#546e7a', '#1b5e20', '#388e3c', '#43a047']};
    pieColorScheme = {domain: ['#2e7d32', '#f9a825', '#c62828']};
    bpCustomColors = [
        {name: 'Approved', value: '#2e7d32'},
        {name: 'Waiting',  value: '#f9a825'},
        {name: 'Rejected', value: '#c62828'}
    ];


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
        // new analytics charts
        this.getCountryDistribution();
        this.getCategoryDistribution();
        this.getTopActiveCompanies();
        // recent activity (last 30 days)
        this.analyticsService.getRecentActivity(30).then(n => { this.recentActivity30 = n; }).catch(() => { this.recentActivity30 = 0; });
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
                this.bpPieData = [
                    {name: 'Approved', value: this.green},
                    {name: 'Waiting',  value: this.yellow},
                    {name: 'Rejected', value: this.red}
                ].filter(d => d.value > 0);
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

            // Also get active company count via manufacturerId facet (distinct publishers)
            const activeCompPromise: Promise<any> = this.simpleSearchService.get(
                '*',
                ['manufacturerId'],
                [],
                1,
                0,
                'score desc',
                '',
                '',
                'Prod');

            Promise.all([catalogPromise, servicePromise, activeCompPromise]).then(([catalogResult, notServiceResult, activeCompResult]) => {
                const totalItemCount: number = catalogResult.totalElements;
                this.product_count = notServiceResult.totalElements;
                this.service_count = totalItemCount - this.product_count;

                // Count distinct companies that have published at least one product
                const mfFacet = activeCompResult && activeCompResult.facets && activeCompResult.facets['manufacturerId'];
                if (mfFacet && mfFacet.entry) {
                    this.activeCompanyCount = mfFacet.entry.filter((e: any) => e.count > 0).length;
                }

                this.loadedps = true;
            });
        });
    }

    onSelect(event: any): void {}

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

    private getCountryDistribution(): void {
        this.analyticsService.getAllParties(0)
            .then(parties => {
                const list = Array.isArray(parties) ? parties : (parties && (parties['parties'] || parties['content'] || []));
                if (!list || !list.length) return;
                const countMap: {[code: string]: number} = {};
                const nameMap: {[code: string]: string} = {};
                for (const party of list) {
                    const addr = party.postalAddress;
                    if (!addr || !addr.country) continue;
                    const code = addr.country.identificationCode && addr.country.identificationCode.value
                        ? addr.country.identificationCode.value : null;
                    const name = addr.country.name && addr.country.name.value
                        ? addr.country.name.value : code;
                    if (!code) continue;
                    countMap[code] = (countMap[code] || 0) + 1;
                    nameMap[code] = name || code;
                }
                this.countryChartData = Object.keys(countMap)
                    .map(code => ({name: nameMap[code] || code, value: countMap[code]}))
                    .sort((a, b) => b.value - a.value);
                this.loadedCountry = this.countryChartData.length > 0;
            })
            .catch(() => {});
    }

    private getCategoryDistribution(): void {
        this.simpleSearchService.get('*', ['commodityClassficationUri'], [], 1, 0, 'score desc', '', '', 'Prod')
            .then(res => {
                const facet = res && res.facets && res.facets['commodityClassficationUri'];
                if (!facet || !facet.entry || !facet.entry.length) return;
                this.categoryChartData = facet.entry
                    .filter((e: any) => e.count > 0)
                    .map((e: any) => {
                        let label: string = e.label || '';
                        if (label.includes('#')) label = label.split('#').pop() || label;
                        else if (label.includes('/')) label = label.split('/').pop() || label;
                        label = label.replace(/([A-Z])/g, ' $1').trim();
                        return {name: label || e.label, value: e.count};
                    })
                    .sort((a: any, b: any) => b.value - a.value)
                    .slice(0, 10);
                this.loadedCategory = this.categoryChartData.length > 0;
            })
            .catch(() => {});
    }

    private getTopActiveCompanies(): void {
        this.analyticsService.getAllParties(0)
            .then(parties => {
                const list = Array.isArray(parties) ? parties : (parties && (parties['parties'] || parties['content'] || []));
                if (!list || !list.length) { this.loadedTopCompanies = true; return; }
                const promises = list.map(party => {
                    const partyId = party.partyIdentification && party.partyIdentification[0]
                        ? party.partyIdentification[0].id : null;
                    const name = party.partyName && party.partyName[0] && party.partyName[0].name
                        ? party.partyName[0].name.value : 'Unknown';
                    if (!partyId) return Promise.resolve(null);
                    return this.analyticsService.getCompanyBPCount(partyId)
                        .then(count => ({name: name, value: count}))
                        .catch(() => null);
                });
                return Promise.all(promises).then((results: any[]) => {
                    this.topCompaniesData = results
                        .filter((r: any) => r !== null && r.value > 0)
                        .sort((a: any, b: any) => b.value - a.value)
                        .slice(0, 5);
                    this.loadedTopCompanies = true;
                });
            })
            .catch(() => { this.loadedTopCompanies = true; });
    }

    showToolTip(content,key) {
        this.tooltipHTML = this.translate.instant(key);
        this.modalService.open(content);
    }
}
