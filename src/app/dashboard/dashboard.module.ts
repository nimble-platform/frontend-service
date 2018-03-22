import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardComponent } from './dashboard.component';
import {DashboardThreadedComponent} from "./dashboard-threaded.component";
import {ThreadSummaryComponent} from "./thread-summary.component";

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		HttpModule,
		ReactiveFormsModule,
		DashboardRoutingModule,
		NgbModule.forRoot()
	],
	declarations: [
		DashboardComponent,
		DashboardThreadedComponent,
		ThreadSummaryComponent
	],
	exports: [
		DashboardComponent,
		DashboardThreadedComponent,
		ThreadSummaryComponent
	],
	providers: [
	]
})

export class DashboardModule {}