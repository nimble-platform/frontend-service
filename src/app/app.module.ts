import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { LoginComponent } from './user-mgmt/login.component';
import { LogoutComponent } from './user-mgmt/logout.component';
import { RegistrationComponent } from './user-mgmt/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserFormComponent } from './user-mgmt/user-form.component';
import { UserService } from './user-mgmt/user.service';
import { CredentialsFormComponent } from './user-mgmt/credentials-form.component';
import { CredentialsService } from './user-mgmt/credentials.service';
import { CategorySearchComponent } from './catalogue/category/category-search.component';
import { CategoryService } from './catalogue/category/category.service';
import { ProductPublishComponent } from './catalogue/product-publish.component';
import { AdditionalItemPropertyComponent } from './catalogue/additional-item-property.component';
import {CatalogueService} from './catalogue/catalogue.service';
import { SimpleSearchComponent } from './simple-search/simple-search.component';
import { SimpleSearchDetailsComponent } from './simple-search/simple-search-details.component';
import { SimpleSearchFormComponent } from './simple-search/simple-search-form.component';
import { SimpleSearchService } from './simple-search/simple-search.service';
import { BPEService } from './bpe/bpe.service';
import { ExplorativeSearchComponent } from './explorative-search/explorative-search.component';
import { ExplorativeSearchService } from './explorative-search/explorative-search.service';
import { ExplorativeSearchFormComponent } from './explorative-search/explorative-search-form.component';
import { ExplorativeSearchDetailsComponent } from './explorative-search/explorative-search-details.component';
import { CompanySettingsComponent } from './user-mgmt/company-settings.component';
import { AddressSubForm } from './user-mgmt/subforms/address.component';
import { DeliveryTermsSubForm } from './user-mgmt/subforms/delivery-terms.component';
import { PaymentMeansForm } from './user-mgmt/subforms/payment-means.component';
import { CommonModule } from '@angular/common';
import { CompanyRegistrationComponent } from './user-mgmt/company-registration.component';


@NgModule({
    imports: [
            BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        NgbModule.forRoot(),
        ReactiveFormsModule,
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
		SimpleSearchComponent,
		SimpleSearchDetailsComponent,
		SimpleSearchFormComponent,
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        AdditionalItemPropertyComponent,
            CompanySettingsComponent,
            AddressSubForm,
            DeliveryTermsSubForm,
            PaymentMeansForm,
            CompanyRegistrationComponent,
        ],
        providers: [
        UserService,
        CredentialsService,
        CategoryService,
        CatalogueService,
		SimpleSearchService,
		BPEService,
        ExplorativeSearchService
        ],
        bootstrap: [
        AppComponent
        ]
})

export class AppModule { }
