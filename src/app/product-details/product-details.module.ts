import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppCommonModule } from "../common/common.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ProductDetailsComponent } from "./product-details.component";
import { ProductDetailsRoutingModule } from "./product-details-routing.module";
import { ProductDetailsTabsComponent } from "./product-details-tabs.component";
import { ProductDetailsOverviewComponent } from "./product-details-overview.component";
import { ProductDetailsCertificatesComponent } from "./product-details-certificates.component";
import { UserMgmtModule } from "../user-mgmt/user-mgmt.module";
import {DiscountModalComponent} from './discount-modal.component';
import {ProductLcpaTabComponent} from "./product-lcpa-tab.component";
import {LcpaDetailModalComponent} from "./lcpa-detail-modal.component";
import {PieChartModule} from '@swimlane/ngx-charts';
import {DiscountDetailsComponent} from './price-option/discount-details.component';
import {PriceOptionCountPipe} from './price-option/price-option-count.pipe';
import {PriceOptionPipe} from './price-option/price-option.pipe';
import {ItemPropertyPriceOptionComponent} from './price-option/item-property-price-option.component';
import {PriceOptionViewComponent} from './price-option/price-option-view.component';
import {DiscountTargetComponent} from './price-option/discount-target.component';
import {QuantityPriceOptionComponent} from './price-option/quantity-price-option.component';

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		HttpModule,
        ReactiveFormsModule,
		ProductDetailsRoutingModule,
		UserMgmtModule,
		NgbModule.forRoot(),
		PieChartModule
	],
	declarations: [
		ProductDetailsComponent,
		ProductDetailsTabsComponent,
		ProductDetailsOverviewComponent,
		ProductDetailsCertificatesComponent,
        DiscountModalComponent,
		ProductLcpaTabComponent,
		LcpaDetailModalComponent,
		DiscountDetailsComponent,
		PriceOptionCountPipe,
		PriceOptionPipe,
		ItemPropertyPriceOptionComponent,
		PriceOptionViewComponent,
		DiscountTargetComponent,
		QuantityPriceOptionComponent,
	],
	exports: [
		ProductDetailsTabsComponent,
		DiscountModalComponent,
		ProductLcpaTabComponent,
		LcpaDetailModalComponent,
		ProductDetailsOverviewComponent,
		DiscountDetailsComponent,
		DiscountTargetComponent,
		QuantityPriceOptionComponent
	],
	providers: [
	]
})

export class ProductDetailsModule {}
