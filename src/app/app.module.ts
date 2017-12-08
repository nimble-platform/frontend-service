import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CookieService } from 'ng2-cookies';

import { AppCommonModule } from "./common/common.module";

// ToDo: Get rid of these dependencies or offer via AppCommonModule
import { UserService } from './user-mgmt/user.service';
import { BPEService } from './bpe/bpe.service';
import { BPDataService } from "./bpe/bp-view/bp-data-service";
import { SearchContextService } from './simple-search/search-context.service';
import {CatalogueService} from "./catalogue/catalogue.service";
import {CategoryService} from "./catalogue/category/category.service";
import {PublishService} from "./catalogue/publish-and-aip.service";

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        ReactiveFormsModule,
		AppCommonModule,
        NgbModule.forRoot()
    ],
    declarations: [
        AppComponent
	],
    providers: [
		CookieService,
		UserService,
        CatalogueService,
        CategoryService,
        PublishService,
		BPEService,
		BPDataService,
		SearchContextService
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
}
