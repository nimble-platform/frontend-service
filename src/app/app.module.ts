/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
 * UB - University of Bremen, Faculty of Production Engineering; Bremen; Germany
 * BIBA - Bremer Institut für Produktion und Logistik GmbH; Bremen; Germany
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
import { AgentService } from './user-mgmt/agent.service';
import { CredentialsService } from './user-mgmt/credentials.service';
import { DataChannelService } from "./data-channel/data-channel.service";
import { UnitService } from './common/unit-service';
import { PrecedingBPDataService } from "./bpe/bp-view/preceding-bp-data-service";
import { TnTService } from './tnt/tnt.service';
import { AnalyticsService } from './analytics/analytics.service';
import { EpcService } from './bpe/bp-view/epc-service';
import { DocumentService } from "./bpe/bp-view/document-service";
import { PublishingPropertyService } from './catalogue/publish/publishing-property.service';
import { FrameContractTransitionService } from "./bpe/bp-view/contract/frame-contract-transition.service";
import { ShoppingCartDataService } from './bpe/shopping-cart/shopping-cart-data-service';
import { CollaborationService } from './catalogue/collaboration/collaboration.service';
import { UnshippedOrdersTransitionService } from './bpe/unshipped-order-transition-service';
import { ValidationService } from './common/validation/validators';
import {ContractService} from './bpe/bp-view/contract-service';

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
            },
            isolate: false
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
        PublishingPropertyService,
        PublishService,
        ExplorativeSearchService,
        SimpleSearchService,
        SearchContextService,
        UnshippedOrdersTransitionService,
        UserService,
        CredentialsService,
        UnitService,
        PrecedingBPDataService,
        TnTService,
        AnalyticsService,
        EpcService,
        DocumentService,
        ContractService,
        ShoppingCartDataService,
        CollaborationService,
        ValidationService,
        AgentService
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
}
