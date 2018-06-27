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

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		HttpModule,
        ReactiveFormsModule,
        ProductDetailsRoutingModule,
		NgbModule.forRoot()
	],
	declarations: [
		ProductDetailsComponent,
		ProductDetailsTabsComponent,
		ProductDetailsOverviewComponent
	],
	exports: [
		ProductDetailsTabsComponent
	],
	providers: [
	]
})

export class ProductDetailsModule {}