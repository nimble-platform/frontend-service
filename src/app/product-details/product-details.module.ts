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
import { TransportationServiceInput } from "./transportation-service-input.component";
import { ProductDetailsCertificatesComponent } from "./product-details-certificates.component";
import { UserMgmtModule } from "../user-mgmt/user-mgmt.module";

@NgModule({
	imports: [
		CommonModule,
		AppCommonModule,
		FormsModule,
		HttpModule,
        ReactiveFormsModule,
		ProductDetailsRoutingModule,
		UserMgmtModule,
		NgbModule.forRoot()
	],
	declarations: [
		ProductDetailsComponent,
		ProductDetailsTabsComponent,
		ProductDetailsOverviewComponent,
		ProductDetailsCertificatesComponent,
		TransportationServiceInput
	],
	exports: [
		ProductDetailsTabsComponent,
		TransportationServiceInput
	],
	providers: [
	]
})

export class ProductDetailsModule {}