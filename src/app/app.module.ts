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
import { AdditionalItemPropertyComponent } from './catalogue/ubl-model-view/additional-item-property.component';
import { CatalogueService } from './catalogue/catalogue.service';
import { SimpleSearchComponent } from './simple-search/simple-search.component';
import { SimpleSearchDetailsComponent } from './simple-search/simple-search-details.component';
import { SimpleSearchFormComponent } from './simple-search/simple-search-form.component';
import { SimpleSearchService } from './simple-search/simple-search.service';
import { BPEService } from './bpe/bpe.service';
import { ExplorativeSearchComponent } from './explorative-search/explorative-search.component';
import { ExplorativeSearchService } from './explorative-search/explorative-search.service';
import { ExplorativeSearchFormComponent } from './explorative-search/explorative-search-form.component';
import { ExplorativeSearchDetailsComponent } from './explorative-search/explorative-search-details.component';
import { ExplorativeSearchFilterComponent } from './explorative-search/explorative-search-filter.component';
import { AddressSubForm } from './user-mgmt/subforms/address.component';
import { DeliveryTermsSubForm } from './user-mgmt/subforms/delivery-terms.component';
import { PaymentMeansForm } from './user-mgmt/subforms/payment-means.component';
import { CompanySettingsComponent } from './user-mgmt/company-settings.component';
import { NegotiationMainComponent } from './bpe/negotiation/negotiation-main.component';
import { CatalogueViewComponent } from './catalogue/ubl-model-view/catalogue-view.component';
import { CatalogueLineViewComponent } from './catalogue/ubl-model-view/catalogue-line-view.component';
import { ProductDetailsComponent } from './catalogue/product-details.component';
import { TradingDetailsComponent } from './catalogue/trading-details.component';
import { PublishService } from './catalogue/publish-and-aip.service';
import { PropertyBlockPipe } from './catalogue/property-block-pipe';
import { ItemPropertyDataSourcePipe } from './catalogue/item-property-data-source-pipe';
import { BPConfigureComponent } from './bpe/bp-configure.component';
import { BPsComponent } from './bpe/bps.component';
import { BPDetailComponent } from './bpe/bp-detail.component';
import { BPService } from './bpe/bp.service';
import { QuantityViewComponent } from "./catalogue/ubl-model-view/quantity-view.component";
import { AmountViewComponent } from "./catalogue/ubl-model-view/amount-view.component";
import { ValueViewComponent } from "./catalogue/ubl-model-view/value-view.component";
import { OrderParametersComponent } from "./bpe/order/order-parameters.component";
import { BPDataService } from "./bpe/bp-data-service";
import { ValueArrayViewComponent } from "./catalogue/ubl-model-view/value-array-view.component";
import { BooleanViewComponent } from "./catalogue/ubl-model-view/boolean-view-component";
import { AddressViewComponent } from "./catalogue/ubl-model-view/address-view.component";
import { CallStatusComponent } from "./common/call-status.component";
import { CertificateViewComponent } from "./catalogue/ubl-model-view/certificate-view.component";
import { DimensionViewComponent } from "./catalogue/ubl-model-view/dimension-view.component";
import { CompanyRegistrationComponent } from './user-mgmt/company-registration.component';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        ReactiveFormsModule,
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
        SimpleSearchComponent,
        SimpleSearchDetailsComponent,
        SimpleSearchFormComponent,
        ExplorativeSearchComponent,
        ExplorativeSearchFormComponent,
        ExplorativeSearchDetailsComponent,
        ExplorativeSearchFilterComponent,
        AdditionalItemPropertyComponent,
        AddressSubForm,
        DeliveryTermsSubForm,
        PaymentMeansForm, CompanySettingsComponent,
        NegotiationMainComponent,
        OrderParametersComponent,
        CatalogueViewComponent,
        CatalogueLineViewComponent,
        ProductDetailsComponent,
        TradingDetailsComponent,
        PropertyBlockPipe,
        ItemPropertyDataSourcePipe,
        AddressViewComponent,
        CertificateViewComponent,
        DimensionViewComponent,
        QuantityViewComponent,
        AmountViewComponent,
        ValueArrayViewComponent,
        ValueViewComponent,
        BooleanViewComponent,
        BPConfigureComponent,
        BPDetailComponent,
        BPsComponent,
        CallStatusComponent,
        CompanyRegistrationComponent,],
    providers: [
        UserService,
        CredentialsService,
        CategoryService,
        CatalogueService,
        SimpleSearchService,
        BPEService,
        ExplorativeSearchService,
        PublishService,
        BPService,
        BPDataService
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
}
