import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {CommonModule} from "@angular/common";
import {AppCommonModule} from "../common/common.module";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {CatalogueRoutingModule} from "./catalogue-routing.module";

import {CategorySearchComponent} from "./category/category-search.component";
import {ProductPublishComponent} from "./product-publish.component";
import {AdditionalItemPropertyComponent} from "./ubl-model-view/additional-item-property.component";
import {CatalogueViewComponent} from "./ubl-model-view/catalogue/catalogue-view.component";
import {CatalogueLinePanelComponent} from "./ubl-model-view/catalogue/catalogue-line-panel.component";
import {CatalogueLineViewComponent} from "./ubl-model-view/catalogue-line/catalogue-line-view.component";
import {CatalogueLineDetailsComponent} from "./ubl-model-view/catalogue-line/catalogue-line-details.component";
import {PropertyBlockPipe} from "./property-block-pipe";
import {ItemPropertyDataSourcePipe} from "./item-property-data-source-pipe";
import {QuantityViewComponent} from "./ubl-model-view/quantity-view.component";
import {AmountViewComponent} from "./ubl-model-view/amount-view.component";
import {ValueViewComponent} from "./ubl-model-view/value-view.component";
import {ValueArrayViewComponent} from "./ubl-model-view/value-array-view.component";
import {BooleanViewComponent} from "./ubl-model-view/boolean-view-component";
import {AddressViewComponent} from "./ubl-model-view/address-view.component";
import {CertificateViewComponent} from "./ubl-model-view/certificate-view.component";
import {DimensionViewComponent} from "./ubl-model-view/dimension-view.component";
import {CatalogueLineHeaderComponent} from "./ubl-model-view/catalogue-line/catalogue-line-header.component";
import {ProductTradingDetailsComponent} from "./ubl-model-view/catalogue-line/product-trading-details.component";
import {TransportationServiceDetails} from "./ubl-model-view/catalogue-line/transportation-service-details.component";
import {ShipmentViewComponent} from "./ubl-model-view/shipment-view.component";
import {PublishDeactivateGuardService} from "./publish-deactivate-guard.service";
import {CategoryDeactivateGuardService} from "./category/category-deactivate-guard.service";
import {QuantityValueViewComponent} from "./ubl-model-view/quantity-value-view.component";
import {DetailedAddressViewComponent} from "./ubl-model-view/detailed-address-view.component";
import {PaymentTermsView} from './ubl-model-view/payment-terms-view';
import { CategoryTreeComponent } from "./category/category-tree.component";
//import { CategoryService } from './category/category.service';
//import { CatalogueService } from './catalogue.service';
//import { PublishService } from './publish-and-aip.service';

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		CatalogueRoutingModule,
		NgbModule.forRoot()
	],
	declarations: [
		CategorySearchComponent,
		CategoryTreeComponent,
        ProductPublishComponent,
        AdditionalItemPropertyComponent,
		CatalogueViewComponent,
		CatalogueLinePanelComponent,
		CatalogueLineViewComponent,
		CatalogueLineDetailsComponent,
		QuantityViewComponent,
		AmountViewComponent,
		QuantityValueViewComponent,
		ValueViewComponent,
		ValueArrayViewComponent,
		BooleanViewComponent,
		AddressViewComponent,
		CertificateViewComponent,
		DimensionViewComponent,
		CatalogueLineHeaderComponent,
		ProductTradingDetailsComponent,
		TransportationServiceDetails,
		ShipmentViewComponent,
		PropertyBlockPipe,
		ItemPropertyDataSourcePipe,
        DetailedAddressViewComponent,
        PaymentTermsView
	],
	exports: [
		CategorySearchComponent,
        ProductPublishComponent,
        AdditionalItemPropertyComponent,
		CatalogueViewComponent,
		CatalogueLinePanelComponent,
		CatalogueLineViewComponent,
		CatalogueLineDetailsComponent,
		QuantityViewComponent,
		AmountViewComponent,
		QuantityValueViewComponent,
		ValueViewComponent,
		ValueArrayViewComponent,
		BooleanViewComponent,
		AddressViewComponent,
		CertificateViewComponent,
		DimensionViewComponent,
		CatalogueLineHeaderComponent,
		ProductTradingDetailsComponent,
		TransportationServiceDetails,
		ShipmentViewComponent,
		PropertyBlockPipe,
		ItemPropertyDataSourcePipe,
        DetailedAddressViewComponent,
        PaymentTermsView
	],
	providers: [
	    PublishDeactivateGuardService,
		CategoryDeactivateGuardService
	]
})

export class CatalogueModule {}