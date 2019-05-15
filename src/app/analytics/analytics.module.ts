import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AnalyticsRoutingModule} from './analytics-routing.module';
import {PlatformAnalyticsComponent} from "./platform-analytics.component";
import {PerformanceAnalyticsComponent} from "../analytics/performance/performance-analytics.component";
import {CompanyAnalyticsComponent} from "./company-analytics.component";
import {TrustPolicyComponent} from "./trust-policy.component";
import {CompanyManagementComponent} from './company-management.component';
import {PlatformInfoComponent} from './platform-info.component';
import {MembersComponent} from './members.component';
import {ChatComponent} from './chat.component';

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        AnalyticsRoutingModule,
        NgbModule.forRoot()
    ],
    declarations: [
        PlatformAnalyticsComponent,
        CompanyAnalyticsComponent,
        TrustPolicyComponent,
        CompanyManagementComponent,
        PlatformInfoComponent,
        MembersComponent,
        ChatComponent,
        PerformanceAnalyticsComponent
    ],
    exports: [
        PlatformAnalyticsComponent,
        CompanyAnalyticsComponent,
        TrustPolicyComponent,
        CompanyManagementComponent,
        PlatformInfoComponent,
        MembersComponent,
        ChatComponent,
        PerformanceAnalyticsComponent
    ],
    providers: []
})

export class AnalyticsModule {
}
