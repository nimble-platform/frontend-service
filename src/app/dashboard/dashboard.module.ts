import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {CommonModule} from "@angular/common";
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {DashboardRoutingModule} from "./dashboard-routing.module";
import {DashboardThreadedComponent} from "./dashboard-threaded.component";
import {FacetComponent} from "./facet-component";
import { CatalogueModule } from "../catalogue/catalogue.module";
import { BPEModule } from "../bpe/bpe.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import {FrameContractTabComponent} from "./frame-contract-tab.component";
import {UnshippedOrdersTabComponent} from './unshipped-orders-tab.component';
import {CollaborationModule} from '../catalogue/collaboration/collaboration.module';

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
		NgbModule.forRoot()
	],
	declarations: [
		DashboardThreadedComponent,
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

export class DashboardModule {}
