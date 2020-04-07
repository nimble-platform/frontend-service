/*
 * Copyright 2020
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   In collaboration with
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
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
