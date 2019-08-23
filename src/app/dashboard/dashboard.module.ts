import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {CommonModule} from "@angular/common";
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {DashboardRoutingModule} from "./dashboard-routing.module";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import {DashboardThreadedComponent} from "./dashboard-threaded.component";
import {FacetComponent} from "./facet-component";
import { CatalogueModule } from "../catalogue/catalogue.module";
import { BPEModule } from "../bpe/bpe.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { ThreadEventComponent } from "../bpe/bp-summary/thread-event.component";
import {FrameContractTabComponent} from "./frame-contract-tab.component";


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
		DashboardRoutingModule,
		CatalogueModule,
		AnalyticsModule,
		BPEModule,
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
		DashboardThreadedComponent,
		FacetComponent,
		FrameContractTabComponent
	],
	exports: [
		DashboardThreadedComponent,
		FacetComponent
	],
	providers: [
	]
})

export class DashboardModule {}
