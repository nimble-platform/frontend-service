/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AnalyticsRoutingModule } from './analytics-routing.module';
import { PlatformAnalyticsComponent } from "./platform-analytics.component";
import { PerformanceAnalyticsComponent } from "./performance/performance-analytics.component";
import { CompanyAnalyticsComponent } from "./company-analytics.component";
import { TrustPolicyComponent } from "./trust-policy.component";
import { CompanyManagementComponent } from './company-management.component';
import { PlatformInfoComponent } from './platform-info.component';
import { MembersComponent } from './members.component';
import { ChatComponent } from './chat.component';
import { HttpClientModule } from "@angular/common/http";
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { PlatformMembersComponent } from './platform-members.component';
import {BusinessProcessCountModalComponent} from './modal/business-process-count-modal.component';
import { MonitorService } from '../dashboard/monitor/monitor.service';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        AnalyticsRoutingModule,
        NgxChartsModule,
        NgbModule
    ],
    declarations: [
        PlatformAnalyticsComponent,
        CompanyAnalyticsComponent,
        TrustPolicyComponent,
        CompanyManagementComponent,
        PlatformInfoComponent,
        MembersComponent,
        PlatformMembersComponent,
        ChatComponent,
        PerformanceAnalyticsComponent,
        BusinessProcessCountModalComponent
    ],
    exports: [
        PlatformAnalyticsComponent,
        CompanyAnalyticsComponent,
        TrustPolicyComponent,
        CompanyManagementComponent,
        PlatformInfoComponent,
        MembersComponent,
        PlatformMembersComponent,
        ChatComponent,
        PerformanceAnalyticsComponent
    ],
    providers: [
        // HCDP-05-03 — PerformanceAnalyticsComponent's Delivery Schedule subsection calls
        // MonitorService.getProcessSummary; DashboardModule already provides its own
        // instance for the dashboard-side tabs. Stateless HTTP service, parallel
        // singletons are safe.
        MonitorService
    ]
})

export class AnalyticsModule {
}
