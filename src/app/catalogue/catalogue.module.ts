import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { CommonModule } from "@angular/common";
import { AppCommonModule } from "../common/common.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { CatalogueRoutingModule } from "./catalogue-routing.module";
import { CategorySearchComponent } from "./category/category-search.component";
import { ProductPublishComponent } from "./publish/product-publish.component";
import { CatalogueViewComponent } from "./ubl-model-view/catalogue/catalogue-view.component";
import { FavouriteViewComponent } from "./favourite/favourite-view.component";
import { CompareViewComponent } from "./compare-product/compare-view.component";
import { CatalogueLinePanelComponent } from "./ubl-model-view/catalogue/catalogue-line-panel.component";
import { PublishDeactivateGuardService } from "./publish-deactivate-guard.service";
import { CategoryDeactivateGuardService } from "./category/category-deactivate-guard.service";
import { CategoryTreeComponent } from "./category/category-tree.component";
import { EditPropertyModalComponent } from "./publish/edit-property-modal.component";
import { ProductDeliveryTradingComponent } from "./publish/product-delivery-trading.component";
import { ProductDetailsModule } from "../product-details/product-details.module";
import { ProductPriceTabComponent } from "./publish/product-price-tab.component";
import { ProductCertificatesTabComponent } from "./publish/product-certificates-tab.component";
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
import {DeleteExportCatalogueModalComponent} from "./ubl-model-view/catalogue/delete-export-catalogue-modal.component";

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
        CatalogueViewComponent,
        DeleteExportCatalogueModalComponent,
        CatalogueLinePanelComponent,
        ProductCertificatesTabComponent,
        NoteFileViewComponent,
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
        CatalogueViewComponent,
        CatalogueLinePanelComponent,
        QuantityPriceOptionComponent,
        ItemPropertyPriceOptionComponent,
        DiscountTargetComponent,
        NoteFileViewComponent,
        PriceOptionViewComponent,
        FavouriteViewComponent,
        CompareViewComponent
    ],
    providers: [PublishDeactivateGuardService, CategoryDeactivateGuardService, LogisticPublishDeactivateGuardService]
})
export class CatalogueModule {}
