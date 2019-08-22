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
import {DiscountModalComponent} from './discount-modal.component';
import {ProductLcpaTabComponent} from "./product-lcpa-tab.component";
import {LcpaDetailModalComponent} from "./lcpa-detail-modal.component";
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HttpClient} from '@angular/common/http';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

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
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })
	],
	declarations: [
		ProductDetailsComponent,
		ProductDetailsTabsComponent,
		ProductDetailsOverviewComponent,
		ProductDetailsCertificatesComponent,
		TransportationServiceInput,
        DiscountModalComponent,
		ProductLcpaTabComponent,
		LcpaDetailModalComponent
	],
	exports: [
		ProductDetailsTabsComponent,
		TransportationServiceInput,
		DiscountModalComponent,
		ProductLcpaTabComponent,
		LcpaDetailModalComponent
	],
	providers: [
	]
})

export class ProductDetailsModule {}