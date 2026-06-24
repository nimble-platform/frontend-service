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

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ng2-cookies';
import { AnalyticsService } from '../analytics/analytics.service';
import { SimpleSearchService } from '../simple-search/simple-search.service';
import { MonitorService, MonitorNotification } from './monitor/monitor.service';
import { getTimeLabel } from '../common/utils';
import * as myGlobals from '../globals';

/**
 * Dashboard Welcome Redesign — Hybrid project hero + live KPIs.
 *
 * A self-contained landing widget rendered inside the WELCOME tab of
 * dashboard-threaded.component. Combines static HarWASTing project branding
 * (sourced from harwasting.eu / CORDIS, GA 101181393) with live platform
 * telemetry pulled from EXISTING endpoints — no new backend:
 *   - Active companies      → SimpleSearchService (Solr manufacturerId facet)
 *   - Negotiation success %  → AnalyticsService.getPerfromanceAnalytics
 *   - Avg deal cycle         → AnalyticsService.getCollabAnalytics (collaborationTime)
 *   - Unread alerts          → MonitorService.getBadgeCount
 *   - Process mix doughnut   → AnalyticsService.getProcessingAnalytics
 *   - Recent activity feed   → MonitorService.getNotifications
 *
 * Every live call degrades gracefully (tile shows "—" / empty state) so a
 * fresh install never looks broken. The static "Our numbers" band guarantees
 * the screen is always populated.
 */
@Component({
    selector: 'welcome-dashboard',
    templateUrl: './welcome-dashboard.component.html',
    styleUrls: ['./welcome-dashboard.component.css']
})
export class WelcomeDashboardComponent implements OnInit {

    config = myGlobals.config;

    // (3) Platform tools. FAF + DPP are still in development → "coming soon".
    tools = [
        { key: 'FAF',  icon: 'fa-chart-line', title: 'FAF',  desc: 'Feedstock availability forecasting', status: 'soon'   },
        { key: 'HCDP', icon: 'fa-store',      title: 'HCDP', desc: 'Collaborative trading marketplace',   status: 'active' },
        { key: 'DPP',  icon: 'fa-box',        title: 'DPP',  desc: 'Digital product passports',           status: 'soon'   }
    ];

    // (4) Live KPI tiles — start as "—" and fill in as calls resolve.
    activeCompanies: string = '—';
    totalCompanies: number = null;
    successRate: string = '—';
    dealCycle: string = '—';
    unreadAlerts: string = '—';

    // (5) Process mix doughnut (reuses HCDP-04-01 shape + colors).
    processTypePieData: any[] = [];
    processTypeCustomColors: any[] = [
        { name: 'Negotiation',  value: '#2e7d32' },
        { name: 'Order',        value: '#1565c0' },
        { name: 'Fulfilment',   value: '#f9a825' },
        { name: 'Transport',    value: '#6a1b9a' },
        { name: 'Info Request', value: '#e65100' }
    ];
    processTotal = 0;

    // (5) Recent activity feed.
    recentActivity: MonitorNotification[] = [];
    activityLoaded = false;

    constructor(
        private analyticsService: AnalyticsService,
        private simpleSearchService: SimpleSearchService,
        private monitorService: MonitorService,
        private cookieService: CookieService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const compId = this.cookieService.get('company_id');
        this.loadKpis(compId);
        this.loadProcessMix(compId);
        this.loadActivity();
    }

    private loadKpis(compId: string): void {
        // Active companies (platform-wide, distinct publishers via Solr facet).
        this.simpleSearchService.get('*', ['manufacturerId'], [], 1, 0, 'score desc', '', '', 'Prod')
            .then(res => {
                const mf = res && res.facets && res.facets['manufacturerId'];
                if (mf && mf.entry) {
                    this.activeCompanies = String(mf.entry.filter((e: any) => e.count > 0).length);
                }
            })
            .catch(() => { });

        if (compId) {
            // Negotiation/deal success rate (company-scoped) + total registered companies.
            this.analyticsService.getPerfromanceAnalytics(compId)
                .then(res => {
                    if (res && res.identity) {
                        this.totalCompanies = res.identity.totalCompanies;
                    }
                    const bpc = res && res.businessProcessCount;
                    if (bpc && bpc.total > 0) {
                        this.successRate = Math.round(bpc.state.approved * 100 / bpc.total) + '%';
                    }
                })
                .catch(() => { });

            // Average deal cycle time (days → human label, e.g. "6.4 D").
            this.analyticsService.getCollabAnalytics(compId)
                .then(res => {
                    const avg = res && res.collaborationTime && res.collaborationTime.averageCollabTime;
                    if (typeof avg === 'number' && avg > 0) {
                        const label = getTimeLabel(avg);
                        if (label) {
                            this.dealCycle = label;
                        }
                    }
                })
                .catch(() => { });
        }

        // Unread Activity Monitor alerts.
        this.monitorService.getBadgeCount()
            .then(c => { this.unreadAlerts = String(c || 0); })
            .catch(() => { });
    }

    private loadProcessMix(compId: string): void {
        if (!compId) { return; }
        this.analyticsService.getProcessingAnalytics(compId)
            .then(proc => {
                const pc = proc && proc.processTypeCounts;
                if (!pc) { return; }
                this.processTypePieData = [
                    { name: 'Negotiation',  value: pc.NEGOTIATION },
                    { name: 'Order',        value: pc.ORDER },
                    { name: 'Fulfilment',   value: pc.FULFILMENT },
                    { name: 'Transport',    value: pc.TRANSPORT_EXECUTION_PLAN },
                    { name: 'Info Request', value: pc.ITEM_INFORMATION_REQUEST }
                ].filter(d => d.value > 0);
                this.processTotal = this.processTypePieData.reduce((s, d) => s + d.value, 0);
            })
            .catch(() => { });
    }

    private loadActivity(): void {
        this.monitorService.getNotifications()
            .then(list => {
                this.activityLoaded = true;
                const arr = (list || []).slice();
                arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                this.recentActivity = arr.slice(0, 5);
            })
            .catch(() => { this.activityLoaded = true; });
    }

    getColorForProcessType(name: string): string {
        const c = this.processTypeCustomColors.find(x => x.name === name);
        return c ? c.value : '#888';
    }

    activityIcon(n: MonitorNotification): string {
        switch (n.notificationType) {
            case 'DELIVERY_DELAY':  return 'fa-truck';
            case 'ANOMALY_DELAY':   return 'fa-exclamation-triangle';
            case 'STATUS_CHANGE':   return 'fa-exchange-alt';
            case 'NEW_PROCESS':     return 'fa-plus-circle';
            case 'CARRIER_CHANGED': return 'fa-truck';
            default:                return 'fa-bell';
        }
    }

    activityColor(n: MonitorNotification): string {
        switch (n.severity) {
            case 'CRITICAL': return '#c62828';
            case 'WARNING':  return '#f9a825';
            default:         return '#2e7d32';
        }
    }

    timeAgo(iso: string): string {
        if (!iso) { return ''; }
        const then = new Date(iso).getTime();
        if (isNaN(then)) { return ''; }
        const mins = Math.floor((Date.now() - then) / 60000);
        if (mins < 1)  { return 'just now'; }
        if (mins < 60) { return mins + 'm ago'; }
        const hrs = Math.floor(mins / 60);
        if (hrs < 24)  { return hrs + 'h ago'; }
        const days = Math.floor(hrs / 24);
        return days + 'd ago';
    }

    onToolClick(tool: any): void {
        if (tool.status === 'active' && tool.key === 'HCDP') {
            this.router.navigate(['/simple-search']);
        }
    }

    onActivityClick(n: MonitorNotification): void {
        // Drill into the Activity Monitor inbox for full context.
        this.router.navigate(['/dashboard'], { queryParams: { tab: 'MONITOR' } });
    }
}
