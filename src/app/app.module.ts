import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CookieService } from 'ng2-cookies';
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppCommonModule } from "./common/common.module";

// ToDo: Get rid of these dependencies or offer via AppCommonModule
import { BPEService } from './bpe/bpe.service';
import { BPService } from './bpe/bp.service';
import { BPDataService } from "./bpe/bp-view/bp-data-service";
import { CatalogueService } from "./catalogue/catalogue.service";
import { CategoryService } from "./catalogue/category/category.service";
import { PublishService } from "./catalogue/publish-and-aip.service";
import { ExplorativeSearchService } from './explorative-search/explorative-search.service';
import { SimpleSearchService } from './simple-search/simple-search.service';
import { SearchContextService } from './simple-search/search-context.service';
import { UserService } from './user-mgmt/user.service';
import { CredentialsService } from './user-mgmt/credentials.service';
import { DataChannelService } from "./data-channel/data-channel.service";
import { UnitService } from './common/unit-service';
import { PrecedingBPDataService } from "./bpe/bp-view/preceding-bp-data-service";
import { TnTService } from './tnt/tnt.service';
import { AnalyticsService } from './analytics/analytics.service';
import { EpcService } from './bpe/bp-view/epc-service';
import {DocumentService} from "./bpe/bp-view/document-service";
import {LogisticPublishingService} from './catalogue/publish/logistic-publishing.service';
import {FrameContractTransitionService} from "./bpe/bp-view/contract/frame-contract-transition.service";

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpModule,
        HttpClientModule,
        AppRoutingModule,
        ReactiveFormsModule,
		    AppCommonModule,
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
        AppComponent
	],
    providers: [
		CookieService,
		BPEService,
        DataChannelService,
		BPService,
		BPDataService,
        FrameContractTransitionService,
		CatalogueService,
        CategoryService,
        LogisticPublishingService,
        PublishService,
		ExplorativeSearchService,
		SimpleSearchService,
		SearchContextService,
		UserService,
		CredentialsService,
        UnitService,
        PrecedingBPDataService,
        TnTService,
        AnalyticsService,
        EpcService,
        DocumentService
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
}
