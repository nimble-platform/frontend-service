import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { CommonModule } from "@angular/common";
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { CatalogueRoutingModule } from "./catalogue-routing.module";
import { CategorySearchComponent } from "./category/category-search.component";
import { ProductPublishComponent } from "./publish/product-publish.component";
import { AdditionalItemPropertyComponent } from "./ubl-model-view/additional-item-property.component";
import { CatalogueViewComponent } from "./ubl-model-view/catalogue/catalogue-view.component";
import { FavouriteViewComponent } from "./favourite/favourite-view.component";
import { CompareViewComponent } from "./compare-product/compare-view.component";
import { CatalogueLinePanelComponent } from "./ubl-model-view/catalogue/catalogue-line-panel.component";
import { CatalogueLineViewComponent } from "./ubl-model-view/catalogue-line/catalogue-line-view.component";
import { CatalogueLineDetailsComponent } from "./ubl-model-view/catalogue-line/catalogue-line-details.component";
import { PropertyBlockPipe } from "./property-block-pipe";
import { ItemPropertyDataSourcePipe } from "./item-property-data-source-pipe";
import { QuantityViewComponent } from "./ubl-model-view/quantity-view.component";
import { AmountViewComponent } from "./ubl-model-view/amount-view.component";
import { ValueViewComponent } from "./ubl-model-view/value-view.component";
import { ValueArrayViewComponent } from "./ubl-model-view/value-array-view.component";
import { BooleanViewComponent } from "./ubl-model-view/boolean-view-component";
import { AddressViewComponent } from "./ubl-model-view/address-view.component";
import { CertificateViewComponent } from "./ubl-model-view/certificate-view.component";
import { DimensionViewComponent } from "./ubl-model-view/dimension-view.component";
import { CatalogueLineHeaderComponent } from "./ubl-model-view/catalogue-line/catalogue-line-header.component";
import { ProductTradingDetailsComponent } from "./ubl-model-view/catalogue-line/product-trading-details.component";
import { TransportationServiceDetails } from "./ubl-model-view/catalogue-line/transportation-service-details.component";
import { ShipmentViewComponent } from "./ubl-model-view/shipment-view.component";
import { PublishDeactivateGuardService } from "./publish-deactivate-guard.service";
import { CategoryDeactivateGuardService } from "./category/category-deactivate-guard.service";
import { QuantityValueViewComponent } from "./ubl-model-view/quantity-value-view.component";
import { DetailedAddressViewComponent } from "./ubl-model-view/detailed-address-view.component";
import { PaymentTermsView } from "./ubl-model-view/payment-terms-view";
import { CategoryTreeComponent } from "./category/category-tree.component";
import { EditPropertyModalComponent } from "./publish/edit-property-modal.component";
import { ProductDeliveryTradingComponent } from "./publish/product-delivery-trading.component";
import { ProductDetailsModule } from "../product-details/product-details.module";
import { ProductPriceTabComponent } from "./publish/product-price-tab.component";
import { ProductCertificatesTabComponent } from "./publish/product-certificates-tab.component";
import { ProductTrackAndTraceTabComponent } from "./publish/product-track-and-trace-tab.component";
import { UserMgmtModule } from "../user-mgmt/user-mgmt.module";
import {NoteFileViewComponent} from './ubl-model-view/note-file-view.component';
import {PriceOptionCountPipe} from "./publish/price-option/price-option-count.pipe";
import {PriceOptionPipe} from "./publish/price-option/price-option.pipe";
import {QuantityPriceOptionComponent} from "./publish/price-option/quantity-price-option.component";
import {ItemPropertyPriceOptionComponent} from "./publish/price-option/item-property-price-option.component";
import {DiscountTargetComponent} from "./publish/price-option/discount-target.component";
import {PriceOptionViewComponent} from './publish/price-option/price-option-view.component';
import {BulkPublishComponent} from "./publish/bulk-publish.component";
import {OptionsPanelComponent} from './publish/options-panel.component';
import {OriginDestinationViewComponent} from './publish/origin-destination-view-component';
import {NameDescriptionPanelComponent} from './publish/name-description-panel.component';
import {LogisticServicePublishComponent} from './publish/logistic-service-publish.component';
import {LogisticPublishDeactivateGuardService} from './logistic-publish-deactivate-guard.service';

@NgModule({
	imports: [CommonModule, 
		AppCommonModule, 
		FormsModule, 
		ReactiveFormsModule, 
		HttpModule, 
        CatalogueRoutingModule, 
        ProductDetailsModule,
        UserMgmtModule,
		NgbModule.forRoot()
	],
    declarations: [
        CategorySearchComponent,
        CategoryTreeComponent,
        ProductPublishComponent,
        LogisticServicePublishComponent,
        EditPropertyModalComponent,
        BulkPublishComponent,
        OptionsPanelComponent,
        OriginDestinationViewComponent,
        NameDescriptionPanelComponent,
        ProductDeliveryTradingComponent,
        ProductPriceTabComponent,
        AdditionalItemPropertyComponent,
        CatalogueViewComponent,
        CatalogueLinePanelComponent,
        CatalogueLineViewComponent,
        CatalogueLineDetailsComponent,
        ProductCertificatesTabComponent,
        ProductTrackAndTraceTabComponent,
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
        PaymentTermsView,
        NoteFileViewComponent,
        PaymentTermsView,
        PriceOptionCountPipe,
        PriceOptionPipe,
        QuantityPriceOptionComponent,
        ItemPropertyPriceOptionComponent,
        DiscountTargetComponent,
        PriceOptionViewComponent,
        FavouriteViewComponent,
        CompareViewComponent
    ],
    exports: [
        CategorySearchComponent,
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
        PaymentTermsView,
        QuantityPriceOptionComponent,
        ItemPropertyPriceOptionComponent,
        DiscountTargetComponent,
        PaymentTermsView,
        NoteFileViewComponent,
        PriceOptionViewComponent,
        FavouriteViewComponent,
        CompareViewComponent
    ],
    providers: [PublishDeactivateGuardService, CategoryDeactivateGuardService, LogisticPublishDeactivateGuardService]
})
export class CatalogueModule {}
