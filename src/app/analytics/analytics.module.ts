import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AnalyticsRoutingModule} from './analytics-routing.module';
import {PlatformAnalyticsComponent} from "./platform-analytics.component";
import {CompanyAnalyticsComponent} from "./company-analytics.component";

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
		    CompanyAnalyticsComponent
    ],
    exports: [
        PlatformAnalyticsComponent,
		    CompanyAnalyticsComponent
    ],
    providers: []
})

export class AnalyticsModule {
}
