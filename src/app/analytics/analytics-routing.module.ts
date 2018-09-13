import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {PlatformAnalyticsComponent} from "./platform-analytics.component";
import {CompanyAnalyticsComponent} from "./company-analytics.component";

const routes: Routes = [
	{path: 'platform', component: PlatformAnalyticsComponent},
	{path: 'company', component: CompanyAnalyticsComponent},
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})

export class AnalyticsRoutingModule {}