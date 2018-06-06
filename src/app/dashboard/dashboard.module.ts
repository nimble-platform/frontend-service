import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {CommonModule} from "@angular/common";
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {DashboardRoutingModule} from "./dashboard-routing.module";

import {DashboardComponent} from "./dashboard.component";
import {DashboardThreadedComponent} from "./dashboard-threaded.component";
import {ThreadSummaryComponent} from "./thread-summary.component";
import {FacetComponent} from "./facet-component";
import { DashboardPaginationComponent } from "./dashboard-pagination.component";

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
		ThreadSummaryComponent,
		FacetComponent,
		DashboardPaginationComponent
	],
	exports: [
		DashboardComponent,
		DashboardThreadedComponent,
		ThreadSummaryComponent,
		FacetComponent
	],
	providers: [
	]
})

export class DashboardModule {}