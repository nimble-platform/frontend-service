import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AnalyticsRoutingModule} from './analytics-routing.module';
import {PlatformAnalyticsComponent} from "./platform-analytics.component";
import {PerformanceAnalyticsComponent} from "./performance/performance-analytics.component";
import {CompanyAnalyticsComponent} from "./company-analytics.component";
import {TrustPolicyComponent} from "./trust-policy.component";
import {CompanyManagementComponent} from './company-management.component';
import {PlatformInfoComponent} from './platform-info.component';
import {MembersComponent} from './members.component';
import {ChatComponent} from './chat.component';
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';


export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    imports: [
        CommonModule,
        AppCommonModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        AnalyticsRoutingModule,
        NgbModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: HttpLoaderFactory,
              deps: [HttpClient]
            }
        })
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
