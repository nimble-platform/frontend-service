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
import { HttpModule } from "@angular/http";
import { CommonModule } from "@angular/common";
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { DashboardRoutingModule } from "./dashboard-routing.module";
import { DashboardThreadedComponent } from "./dashboard-threaded.component";
import { FacetComponent } from "./facet-component";
import { CatalogueModule } from "../catalogue/catalogue.module";
import { BPEModule } from "../bpe/bpe.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { FrameContractTabComponent } from "./frame-contract-tab.component";
import { UnshippedOrdersTabComponent } from './unshipped-orders-tab.component';
import { CollaborationModule } from '../catalogue/collaboration/collaboration.module';
import { CollaborationGroupsTabComponent } from './groups/collaboration-groups-tab.component';
import { ProjectTimeline } from './groups/project-timeline.component';
import { ProcessInstanceGroupsTabComponent } from './groups/process-instance-groups-tab.component';
import {DemandModule} from '../demand/demand.module';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        DashboardRoutingModule,
        CatalogueModule,
        AnalyticsModule,
        CollaborationModule,
        BPEModule,
        DemandModule,
        NgbModule.forRoot()
    ],
    declarations: [
        DashboardThreadedComponent,
        CollaborationGroupsTabComponent,
        ProcessInstanceGroupsTabComponent,
        ProjectTimeline,
        FacetComponent,
        FrameContractTabComponent,
        UnshippedOrdersTabComponent
    ],
    exports: [
        DashboardThreadedComponent,
        FacetComponent
    ],
    providers: [
    ]
})

export class DashboardModule { }
