import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {AppRoutingModule} from './app-routing.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AppComponent} from './app.component';
import {LoginComponent} from './user-mgmt/login.component';
import {LogoutComponent} from './user-mgmt/logout.component';
import {RegistrationComponent} from './user-mgmt/registration.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {UserFormComponent} from './user-mgmt/user-form.component';
import {UserService} from './user-mgmt/user.service';
import {CredentialsFormComponent} from './user-mgmt/credentials-form.component';
import {CredentialsService} from './user-mgmt/credentials.service';
import {CategorySearchComponent} from './catalogue/category/category-search.component';
import {CategoryService} from './catalogue/category/category.service';
import {ProductPublishComponent} from './catalogue/product-publish.component';
import {AdditionalItemPropertyComponent} from './catalogue/additional-item-property.component';
import {CatalogueService} from './catalogue/catalogue.service';
import {SimpleSearchComponent} from './simple-search/simple-search.component';
import {SimpleSearchDetailsComponent} from './simple-search/simple-search-details.component';
import {SimpleSearchFormComponent} from './simple-search/simple-search-form.component';
import {SimpleSearchService} from './simple-search/simple-search.service';
import {BPEService} from './bpe/bpe.service';
import {ExplorativeSearchComponent} from './explorative-search/explorative-search.component';
import {ExplorativeSearchService} from './explorative-search/explorative-search.service';
import {ExplorativeSearchFormComponent} from './explorative-search/explorative-search-form.component';
import {ExplorativeSearchDetailsComponent} from './explorative-search/explorative-search-details.component';
import {ProductPropertiesComponent} from "./catalogue/product-properties.component";
import {CatalogueViewComponent} from "./catalogue/catalogue-view.component";
import {CatalogueLineViewComponent} from "./catalogue/catalogue-line-view.component";
import {ProductDetailsComponent} from "./catalogue/product-details.component";
import {TradingDetailsComponent} from "./catalogue/trading-details.component";

import { PublishAndAIPCService } from "./catalogue/publish-and-aip.service";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        NgbModule.forRoot()
    ],
    declarations: [
        AppComponent,
        LoginComponent,
        LogoutComponent,
        RegistrationComponent,
        DashboardComponent,
        UserFormComponent,
        CredentialsFormComponent,
        CategorySearchComponent,
        ProductPublishComponent,
        AdditionalItemPropertyComponent,
        ProductPropertiesComponent,
        SimpleSearchComponent,
        SimpleSearchDetailsComponent,
        SimpleSearchFormComponent,
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        AdditionalItemPropertyComponent,
        CatalogueViewComponent,
        CatalogueLineViewComponent,
        ProductDetailsComponent,
        TradingDetailsComponent
    ],
    providers: [
        UserService,
        CredentialsService,
        CategoryService,
        CatalogueService,
        SimpleSearchService,
        BPEService,
	ExplorativeSearchService,
 PublishAndAIPCService 
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
}
