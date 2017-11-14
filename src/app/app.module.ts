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
import {CatalogueViewComponent} from "./catalogue/ubl-model-view/catalogue/catalogue-view.component";
import {CatalogueLinePanelComponent} from "./catalogue/ubl-model-view/catalogue/catalogue-line-panel.component";
import {CatalogueLineViewComponent} from "./catalogue/ubl-model-view/catalogue-line/catalogue-line-view.component";
import { ProductDetailsComponent } from './catalogue/ubl-model-view/catalogue-line/product-details.component';
import { TradingDetailsComponent } from './bpe/trading-details.component';
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
import { BPDataService } from "./bpe/bp-data-service";
import { ValueArrayViewComponent } from "./catalogue/ubl-model-view/value-array-view.component";
import { BooleanViewComponent } from "./catalogue/ubl-model-view/boolean-view-component";
import { AddressViewComponent } from "./catalogue/ubl-model-view/address-view.component";
import { CallStatusComponent } from "./common/call-status.component";
import { CertificateViewComponent } from "./catalogue/ubl-model-view/certificate-view.component";
import { DimensionViewComponent } from "./catalogue/ubl-model-view/dimension-view.component";
import { CompanyRegistrationComponent } from './user-mgmt/company-registration.component';
import { CommonModule } from '@angular/common';
import {CatalogueLineHeaderComponent} from "./catalogue/ubl-model-view/catalogue-line/catalogue-line-header.component";
import {ProductBpOptionsComponent} from "./bpe/product-bp-options.component";
import {RequestForQuotationComponent} from "./bpe/bp-view/negotiation/request-for-quotation.component";
import {OrderResponseComponent} from "./bpe/bp-view/order/order-response.component";
import {OrderBpComponent} from "./bpe/bp-view/order/order-bp.component";
import {OrderComponent} from "./bpe/bp-view/order/order.component";
import {FulfilmentComponent} from "./bpe/bp-view/fulfilment/fulfilment.component";
import {DespatchAdviceComponent} from "./bpe/bp-view/fulfilment/despatch-advice.component";
import {ReceiptAdviceComponent} from "./bpe/bp-view/fulfilment/receipt-advice.component";
import {NegotiationComponent} from "./bpe/bp-view/negotiation/negotiation.component";
import {QuotationComponent} from "./bpe/bp-view/negotiation/quotation.component";
import {ProductTradingDetailsComponent} from "./catalogue/ubl-model-view/catalogue-line/product-trading-details.component";
import {TransportationServiceDetails} from "./catalogue/ubl-model-view/catalogue-line/transportation-service-details.component";
import {TransportExecutionPlanBpComponent} from "./bpe/bp-view/transport-execution-plan/transport-execution-plan-bp.component";
import {TransportExecutionPlanRequestComponent} from "./bpe/bp-view/transport-execution-plan/transport-execution-plan-request.component";
import {TransportExecutionPlanComponent} from "./bpe/bp-view/transport-execution-plan/transport-execution-plan.component";
import {SearchContextService} from "./simple-search/search-context.service";
import {ShipmentViewComponent} from "./catalogue/ubl-model-view/shipment-view.component";

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
        PaymentMeansForm,
        CompanySettingsComponent,
        NegotiationComponent,
        RequestForQuotationComponent,
        QuotationComponent,
        OrderBpComponent,
        OrderComponent,
        OrderResponseComponent,
        FulfilmentComponent,
        DespatchAdviceComponent,
        ReceiptAdviceComponent,
        TransportExecutionPlanBpComponent,
        TransportExecutionPlanRequestComponent,
        TransportExecutionPlanComponent,
        CatalogueViewComponent,
        CatalogueLineHeaderComponent,
        CatalogueLinePanelComponent,
        CatalogueLineViewComponent,
        ProductDetailsComponent,
        TransportationServiceDetails,
        ProductTradingDetailsComponent,
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
        ShipmentViewComponent,
        BPConfigureComponent,
        BPDetailComponent,
        BPsComponent,
        ProductBpOptionsComponent,
        CallStatusComponent,
        CompanyRegistrationComponent],
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
        BPDataService,
        SearchContextService
    ],
    bootstrap: [
        AppComponent
    ]
})

export class AppModule {
}
