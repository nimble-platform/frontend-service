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

import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from "@angular/common";
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { DashboardRoutingModule } from "./dashboard-routing.module";
import { DashboardThreadedComponent } from "./dashboard-threaded.component";
import { WelcomeDashboardComponent } from "./welcome-dashboard.component";
import { FacetComponent } from "./facet-component";
import { CatalogueModule } from "../catalogue/catalogue.module";
import { BPEModule } from "../bpe/bpe.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { FrameContractTabComponent } from "./frame-contract-tab.component";
import { UnshippedOrdersTabComponent } from './unshipped-orders-tab.component';
import { PendingReceiptsTabComponent } from './pending-receipts-tab.component';
import { CollaborationModule } from '../catalogue/collaboration/collaboration.module';
import { CollaborationGroupsTabComponent } from './groups/collaboration-groups-tab.component';
import { ProjectTimeline } from './groups/project-timeline.component';
import { ProcessInstanceGroupsTabComponent } from './groups/process-instance-groups-tab.component';
import {DemandModule} from '../demand/demand.module';
import {MonitorComponent} from './monitor/monitor.component';
import {MonitorService} from './monitor/monitor.service';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        DashboardRoutingModule,
        CatalogueModule,
        AnalyticsModule,
        CollaborationModule,
        BPEModule,
        DemandModule,
        RouterModule,
        NgxChartsModule,
        NgbModule
    ],
    declarations: [
        DashboardThreadedComponent,
        WelcomeDashboardComponent,
        CollaborationGroupsTabComponent,
        ProcessInstanceGroupsTabComponent,
        ProjectTimeline,
        FacetComponent,
        FrameContractTabComponent,
        UnshippedOrdersTabComponent,
        PendingReceiptsTabComponent,
        MonitorComponent
    ],
    exports: [
        DashboardThreadedComponent,
        FacetComponent
    ],
    providers: [
        MonitorService
    ]
})

export class DashboardModule { }
